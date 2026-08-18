/**
 * Resolution Outlook — V1 Classification Tests
 *
 * Covers the policy boundaries:
 *   - Temporal gate (DTE ≤ 5)
 *   - Spatial gate (|moneyness| > 3%)
 *   - Sign handling (ITM → likely-assigned, OTM → likely-expires-otm)
 *   - Null moneyness → uncertain
 *   - Beyond current month → uncertain
 *   - Both gates required for directional classification
 */

import { describe, it, expect } from "vitest";
import {
  classifyPosition,
  classifyAllPositions,
  TEMPORAL_WINDOW_DTE,
  MONEYNESS_BUFFER,
  type ResolutionOutlook,
} from "../../src/forecast/resolution-outlook";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";

// --- Test Helpers ---

function makePosition(overrides: Partial<MonitoredPosition> = {}): MonitoredPosition {
  return {
    id: "test-pos-1",
    type: "call",
    underlying: "XLE",
    strike: 55,
    expiration: "2026-08-22",
    dte: 3,
    quantity: 2,
    encumberedCapital: 11000,
    capitalValuationBasis: "market-value-at-import",
    capitalAsOf: "2026-08-18",
    moneyness: 0.05, // 5% ITM
    underlyingPrice: 57.75,
    priceObservedAt: "2026-08-18T10:00:00Z",
    evidenceGeneration: 5,
    acquisitionStatus: "FRESH",
    lastAttemptAt: "2026-08-18T10:00:00Z",
    failureCount: 0,
    ...overrides,
  };
}

const NOW = new Date("2026-08-18T12:00:00Z");

// --- Temporal Gate Tests ---

describe("Resolution Outlook — Temporal Gate", () => {
  it("classifies position within temporal window (DTE ≤ 5)", () => {
    const pos = makePosition({ dte: 5, moneyness: 0.06 }); // 6% ITM, 5 DTE
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("likely-assigned");
  });

  it("classifies position at exactly temporal boundary (DTE = 5)", () => {
    const pos = makePosition({ dte: 5, moneyness: -0.08 }); // 8% OTM, 5 DTE
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("likely-expires-otm");
  });

  it("returns uncertain when DTE exceeds temporal window", () => {
    const pos = makePosition({ dte: 6, moneyness: 0.10 }); // deeply ITM but 6 DTE
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("uncertain");
    expect(result.evidence.reason).toContain("DTE 6 exceeds temporal window");
  });

  it("returns uncertain for high-DTE position even when deeply OTM", () => {
    const pos = makePosition({ dte: 15, moneyness: -0.12 }); // 12% OTM, 15 DTE
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("uncertain");
  });
});

// --- Spatial Gate Tests ---

describe("Resolution Outlook — Spatial Gate", () => {
  it("classifies position outside moneyness buffer", () => {
    const pos = makePosition({ dte: 3, moneyness: 0.04 }); // 4% ITM > 3% buffer
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("likely-assigned");
  });

  it("returns uncertain when moneyness equals buffer exactly", () => {
    const pos = makePosition({ dte: 3, moneyness: 0.03 }); // exactly at 3% boundary
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("uncertain");
    expect(result.evidence.reason).toContain("within buffer");
  });

  it("returns uncertain when moneyness is within buffer (OTM side)", () => {
    const pos = makePosition({ dte: 2, moneyness: -0.02 }); // 2% OTM < 3% buffer
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("uncertain");
  });

  it("returns uncertain when moneyness is zero (exactly ATM)", () => {
    const pos = makePosition({ dte: 1, moneyness: 0.0 });
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("uncertain");
  });
});

// --- Sign Handling Tests ---

describe("Resolution Outlook — Directional Classification", () => {
  it("positive moneyness (ITM) → likely-assigned", () => {
    const pos = makePosition({ dte: 3, moneyness: 0.07 });
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("likely-assigned");
    expect(result.evidence.reason).toContain("ITM");
  });

  it("negative moneyness (OTM) → likely-expires-otm", () => {
    const pos = makePosition({ dte: 3, moneyness: -0.05 });
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("likely-expires-otm");
    expect(result.evidence.reason).toContain("OTM");
  });

  it("works for put positions (sign semantics are the same)", () => {
    const pos = makePosition({ type: "put", dte: 2, moneyness: 0.06 }); // ITM put
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("likely-assigned");
  });

  it("works for buy-write positions", () => {
    const pos = makePosition({ type: "buy-write", dte: 4, moneyness: -0.08 });
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("likely-expires-otm");
  });
});

// --- Null Moneyness Tests ---

describe("Resolution Outlook — Missing Evidence", () => {
  it("null moneyness → uncertain (cannot classify without price)", () => {
    const pos = makePosition({ dte: 2, moneyness: null, underlyingPrice: null });
    const result = classifyPosition(pos, true, NOW);
    expect(result.category).toBe("uncertain");
    expect(result.evidence.reason).toContain("No price observation");
  });

  it("evidence fields preserved even when uncertain", () => {
    const pos = makePosition({ dte: 3, moneyness: null });
    const result = classifyPosition(pos, true, NOW);
    expect(result.evidence.dte).toBe(3);
    expect(result.evidence.moneyness).toBeNull();
    expect(result.evidence.strike).toBe(55);
  });
});

// --- Beyond Current Month Tests ---

describe("Resolution Outlook — Month Boundary", () => {
  it("position expiring beyond current month → uncertain", () => {
    const pos = makePosition({ dte: 30, moneyness: 0.10 }); // deeply ITM but beyond month
    const result = classifyPosition(pos, false, NOW); // expiresThisMonth = false
    expect(result.category).toBe("uncertain");
    expect(result.expiresThisMonth).toBe(false);
    expect(result.evidence.reason).toContain("beyond current month");
  });

  it("expiresThisMonth flag correctly passed through", () => {
    const pos = makePosition({ dte: 3, moneyness: 0.06 });
    const resultThisMonth = classifyPosition(pos, true, NOW);
    const resultNextMonth = classifyPosition(pos, false, NOW);
    expect(resultThisMonth.category).toBe("likely-assigned");
    expect(resultNextMonth.category).toBe("uncertain");
  });
});

// --- Batch Classification Tests ---

describe("Resolution Outlook — Batch Classification", () => {
  it("classifies multiple positions correctly", () => {
    const positions: MonitoredPosition[] = [
      makePosition({ id: "p1", dte: 3, moneyness: 0.06, expiration: "2026-08-22" }),
      makePosition({ id: "p2", dte: 3, moneyness: -0.07, expiration: "2026-08-22" }),
      makePosition({ id: "p3", dte: 3, moneyness: 0.01, expiration: "2026-08-22" }),
      makePosition({ id: "p4", dte: 20, moneyness: 0.10, expiration: "2026-09-19" }),
    ];

    const monthEnd = new Date("2026-08-31");
    const results = classifyAllPositions(positions, monthEnd, NOW);

    expect(results).toHaveLength(4);
    expect(results[0].category).toBe("likely-assigned");
    expect(results[1].category).toBe("likely-expires-otm");
    expect(results[2].category).toBe("uncertain"); // within buffer
    expect(results[3].category).toBe("uncertain"); // beyond month
  });

  it("determines expiresThisMonth from monthEnd date", () => {
    const positions: MonitoredPosition[] = [
      makePosition({ id: "p1", expiration: "2026-08-22" }), // before month end
      makePosition({ id: "p2", expiration: "2026-09-19" }), // after month end
    ];

    const monthEnd = new Date("2026-08-31");
    const results = classifyAllPositions(positions, monthEnd, NOW);

    expect(results[0].expiresThisMonth).toBe(true);
    expect(results[1].expiresThisMonth).toBe(false);
  });
});

// --- Evidence Recording Tests ---

describe("Resolution Outlook — Evidence Provenance", () => {
  it("records classification timestamp", () => {
    const pos = makePosition({ dte: 3, moneyness: 0.06 });
    const result = classifyPosition(pos, true, NOW);
    expect(result.evidence.classifiedAt).toBe("2026-08-18T12:00:00.000Z");
  });

  it("records the evidence state that produced the classification", () => {
    const pos = makePosition({
      dte: 4,
      moneyness: -0.055,
      underlyingPrice: 52.0,
      strike: 55,
    });
    const result = classifyPosition(pos, true, NOW);
    expect(result.evidence.dte).toBe(4);
    expect(result.evidence.moneyness).toBe(-0.055);
    expect(result.evidence.underlyingPrice).toBe(52.0);
    expect(result.evidence.strike).toBe(55);
  });

  it("provides human-readable reason for directional classification", () => {
    const pos = makePosition({ dte: 2, moneyness: 0.08 });
    const result = classifyPosition(pos, true, NOW);
    expect(result.evidence.reason).toMatch(/ITM by 8\.0% with 2 DTE/);
  });

  it("provides human-readable reason for uncertain classification", () => {
    const pos = makePosition({ dte: 2, moneyness: 0.02 });
    const result = classifyPosition(pos, true, NOW);
    expect(result.evidence.reason).toMatch(/2\.0% within buffer/);
  });
});

// --- Policy Parameter Constants ---

describe("Resolution Outlook — Policy Parameters", () => {
  it("exports temporal window as 5 DTE", () => {
    expect(TEMPORAL_WINDOW_DTE).toBe(5);
  });

  it("exports moneyness buffer as 0.03 (3%)", () => {
    expect(MONEYNESS_BUFFER).toBe(0.03);
  });
});
