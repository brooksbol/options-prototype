import { describe, it, expect } from "vitest";
import {
  midPrice,
  premiumPerContract,
  annualizedYield,
  moneyness,
  assignmentProbability,
} from "../../src/domain/calculations";

describe("midPrice (BR-1)", () => {
  it("returns arithmetic mean of bid and ask", () => {
    expect(midPrice(1.0, 1.2)).toBeCloseTo(1.1);
  });

  it("returns exact value when bid equals ask (zero spread)", () => {
    expect(midPrice(5.0, 5.0)).toBe(5.0);
  });

  it("handles small spreads correctly", () => {
    expect(midPrice(2.5, 2.52)).toBeCloseTo(2.51);
  });

  it("handles large values", () => {
    expect(midPrice(100.0, 102.0)).toBeCloseTo(101.0);
  });
});

describe("premiumPerContract (BR-2)", () => {
  it("multiplies mid by 100 (contract multiplier)", () => {
    expect(premiumPerContract(1.1)).toBeCloseTo(110.0);
  });

  it("handles zero mid", () => {
    expect(premiumPerContract(0)).toBe(0);
  });

  it("handles fractional mid", () => {
    expect(premiumPerContract(0.05)).toBeCloseTo(5.0);
  });
});

describe("annualizedYield (BR-3)", () => {
  it("calculates yield for 30 DTE", () => {
    // (2.00 / 500) * (365 / 30) * 100 = 4.8667
    expect(annualizedYield(2.0, 500, 30)).toBeCloseTo(4.8667, 3);
  });

  it("calculates yield for 7 DTE", () => {
    // (1.50 / 545) * (365 / 7) * 100 = 14.352
    expect(annualizedYield(1.5, 545, 7)).toBeCloseTo(14.352, 2);
  });

  it("returns 0 when DTE is 0 (avoids division by zero)", () => {
    expect(annualizedYield(2.0, 500, 0)).toBe(0);
  });

  it("returns 0 when collateral is 0 (degenerate case)", () => {
    expect(annualizedYield(2.0, 0, 30)).toBe(0);
  });

  it("handles typical covered call scenario", () => {
    // SPY at $545, selling call for $3.50 mid, 14 DTE
    // (3.50 / 545) * (365 / 14) * 100 = 16.74
    expect(annualizedYield(3.5, 545, 14)).toBeCloseTo(16.74, 1);
  });

  it("handles typical cash-secured put scenario", () => {
    // Put strike $540, mid $2.00, 14 DTE
    // (2.00 / 540) * (365 / 14) * 100 = 9.656
    expect(annualizedYield(2.0, 540, 14)).toBeCloseTo(9.656, 2);
  });
});

describe("moneyness (BR-4)", () => {
  describe("calls", () => {
    it("classifies ITM when strike < underlying", () => {
      expect(moneyness(540, 545, "CALL")).toBe("ITM");
    });

    it("classifies OTM when strike > underlying", () => {
      expect(moneyness(550, 545, "CALL")).toBe("OTM");
    });

    it("classifies ATM when strike equals underlying", () => {
      expect(moneyness(545, 545, "CALL")).toBe("ATM");
    });

    it("classifies ATM within $0.50 tolerance", () => {
      expect(moneyness(545.25, 545, "CALL")).toBe("ATM");
      expect(moneyness(544.75, 545, "CALL")).toBe("ATM");
      expect(moneyness(545.5, 545, "CALL")).toBe("ATM");
    });

    it("classifies OTM just outside ATM tolerance", () => {
      expect(moneyness(545.51, 545, "CALL")).toBe("OTM");
    });

    it("classifies ITM just outside ATM tolerance", () => {
      expect(moneyness(544.49, 545, "CALL")).toBe("ITM");
    });
  });

  describe("puts", () => {
    it("classifies ITM when strike > underlying", () => {
      expect(moneyness(550, 545, "PUT")).toBe("ITM");
    });

    it("classifies OTM when strike < underlying", () => {
      expect(moneyness(540, 545, "PUT")).toBe("OTM");
    });

    it("classifies ATM when strike equals underlying", () => {
      expect(moneyness(545, 545, "PUT")).toBe("ATM");
    });

    it("classifies ATM within $0.50 tolerance", () => {
      expect(moneyness(545.25, 545, "PUT")).toBe("ATM");
      expect(moneyness(544.75, 545, "PUT")).toBe("ATM");
    });

    it("classifies ITM just outside ATM tolerance", () => {
      expect(moneyness(545.51, 545, "PUT")).toBe("ITM");
    });

    it("classifies OTM just outside ATM tolerance", () => {
      expect(moneyness(544.49, 545, "PUT")).toBe("OTM");
    });
  });
});

describe("assignmentProbability (BR-5)", () => {
  it("returns absolute value of delta", () => {
    expect(assignmentProbability(-0.3)).toBeCloseTo(0.3);
  });

  it("handles positive delta (calls)", () => {
    expect(assignmentProbability(0.45)).toBeCloseTo(0.45);
  });

  it("handles deep ITM delta", () => {
    expect(assignmentProbability(-0.95)).toBeCloseTo(0.95);
  });

  it("handles far OTM delta", () => {
    expect(assignmentProbability(0.05)).toBeCloseTo(0.05);
  });

  it("handles zero delta", () => {
    expect(assignmentProbability(0)).toBe(0);
  });
});
