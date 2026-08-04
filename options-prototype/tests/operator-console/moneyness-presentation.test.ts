/**
 * Moneyness Presentation Classification — Deterministic Tests
 *
 * Validates that the presentation layer correctly classifies
 * MonitoredPosition.moneyness into OTM/ATM/ITM/none visual states
 * and produces the corresponding labels.
 *
 * These tests do not require a live market or Evidence backend.
 */

import { describe, it, expect } from "vitest";
import { classifyMoneyness, moneynessLabel, formatMoneynessDisplay, ATM_TOLERANCE } from "../../src/operator-console/moneyness-presentation";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";

// --- Helper: minimal MonitoredPosition with just moneyness set ---

function positionWithMoneyness(moneyness: number | null): MonitoredPosition {
  return {
    id: "test-pos",
    type: "put",
    underlying: "XLE",
    strike: 55,
    expiration: "2026-08-08",
    dte: 4,
    quantity: 1,
    encumberedCapital: 5500,
    capitalValuationBasis: "strike",
    capitalAsOf: "2026-08-04",
    moneyness,
    underlyingPrice: moneyness != null ? 55 * (1 - moneyness) : null, // approximate
    priceObservedAt: moneyness != null ? "2026-08-04T16:00:00Z" : null,
    evidenceGeneration: moneyness != null ? 5000 : null,
    acquisitionStatus: moneyness != null ? "ready" : null,
    lastAttemptAt: moneyness != null ? "2026-08-04T16:00:00Z" : null,
    failureCount: 0,
  };
}

// --- Classification Tests ---

describe("classifyMoneyness", () => {
  describe("OTM (out of the money)", () => {
    it("classifies clearly OTM put (moneyness = -0.10)", () => {
      expect(classifyMoneyness(positionWithMoneyness(-0.10))).toBe("otm");
    });

    it("classifies deeply OTM (moneyness = -0.50)", () => {
      expect(classifyMoneyness(positionWithMoneyness(-0.50))).toBe("otm");
    });

    it("classifies barely OTM (moneyness = -0.011, just outside tolerance)", () => {
      expect(classifyMoneyness(positionWithMoneyness(-0.011))).toBe("otm");
    });
  });

  describe("ITM (in the money)", () => {
    it("classifies clearly ITM call (moneyness = +0.10)", () => {
      expect(classifyMoneyness(positionWithMoneyness(0.10))).toBe("itm");
    });

    it("classifies deeply ITM (moneyness = +0.40)", () => {
      expect(classifyMoneyness(positionWithMoneyness(0.40))).toBe("itm");
    });

    it("classifies barely ITM (moneyness = +0.011, just outside tolerance)", () => {
      expect(classifyMoneyness(positionWithMoneyness(0.011))).toBe("itm");
    });
  });

  describe("ATM (at the money / near strike)", () => {
    it("classifies exact ATM (moneyness = 0)", () => {
      expect(classifyMoneyness(positionWithMoneyness(0))).toBe("atm");
    });

    it("classifies slightly positive within tolerance (moneyness = +0.005)", () => {
      expect(classifyMoneyness(positionWithMoneyness(0.005))).toBe("atm");
    });

    it("classifies slightly negative within tolerance (moneyness = -0.005)", () => {
      expect(classifyMoneyness(positionWithMoneyness(-0.005))).toBe("atm");
    });

    it("classifies at exact positive boundary (moneyness = +0.01)", () => {
      expect(classifyMoneyness(positionWithMoneyness(ATM_TOLERANCE))).toBe("atm");
    });

    it("classifies at exact negative boundary (moneyness = -0.01)", () => {
      expect(classifyMoneyness(positionWithMoneyness(-ATM_TOLERANCE))).toBe("atm");
    });
  });

  describe("no observation", () => {
    it("classifies null moneyness as none", () => {
      expect(classifyMoneyness(positionWithMoneyness(null))).toBe("none");
    });
  });
});

// --- Label Tests ---

describe("moneynessLabel", () => {
  it("returns OTM for otm state", () => {
    expect(moneynessLabel("otm")).toBe("OTM");
  });

  it("returns ATM for atm state", () => {
    expect(moneynessLabel("atm")).toBe("ATM");
  });

  it("returns ITM for itm state", () => {
    expect(moneynessLabel("itm")).toBe("ITM");
  });

  it("returns null for none state (no label shown)", () => {
    expect(moneynessLabel("none")).toBeNull();
  });
});

// --- Tolerance boundary ---

describe("ATM_TOLERANCE", () => {
  it("is 1% (0.01)", () => {
    expect(ATM_TOLERANCE).toBe(0.01);
  });
});


// --- formatMoneynessDisplay Tests ---

describe("formatMoneynessDisplay", () => {
  it("formats clearly ITM with positive sign", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(0.369))).toBe("ITM +36.9%");
  });

  it("formats clearly OTM with negative value", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(-0.067))).toBe("OTM -6.7%");
  });

  it("formats ATM positive side with sign", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(0.004))).toBe("ATM +0.4%");
  });

  it("formats ATM negative side", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(-0.008))).toBe("ATM -0.8%");
  });

  it("formats exact zero as ATM +0.0%", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(0))).toBe("ATM +0.0%");
  });

  it("normalizes negative zero to ATM +0.0%", () => {
    // A moneyness of -0.0004 rounds to -0.0% without normalization
    expect(formatMoneynessDisplay(positionWithMoneyness(-0.0004))).toBe("ATM +0.0%");
  });

  it("rounds to one decimal place", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(0.12345))).toBe("ITM +12.3%");
    expect(formatMoneynessDisplay(positionWithMoneyness(-0.06789))).toBe("OTM -6.8%");
  });

  it("returns null for null moneyness", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(null))).toBeNull();
  });

  it("handles deeply OTM puts (large negative)", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(-0.995))).toBe("OTM -99.5%");
  });

  it("handles deeply ITM calls (large positive)", () => {
    expect(formatMoneynessDisplay(positionWithMoneyness(0.949))).toBe("ITM +94.9%");
  });
});
