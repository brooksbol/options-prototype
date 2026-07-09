/**
 * Tests for opportunity evaluation logic.
 *
 * Tests deriveOpportunityRow (pure function) with various chain scenarios.
 */

import { describe, it, expect } from "vitest";
import { deriveOpportunityRow } from "../../src/opportunity/evaluate";
import type { OptionsChain, OptionContract } from "../../src/domain/types";
import type { OpportunityPolicy } from "../../src/opportunity/types";

// --- Test helpers ---

function makeContract(overrides: Partial<OptionContract> & { type: "CALL" | "PUT"; strike: number }): OptionContract {
  return {
    bid: 1.00,
    ask: 1.20,
    delta: 0.30,
    openInterest: 500,
    volume: 100,
    ...overrides,
  };
}

function makeChain(overrides?: Partial<OptionsChain>): OptionsChain {
  return {
    underlying: { symbol: "XLE", name: "Energy Select Sector SPDR", price: 85.00 },
    expiration: { date: "2026-07-18", dte: 14 },
    calls: [
      makeContract({ type: "CALL", strike: 87, delta: 0.30, bid: 1.10, ask: 1.30 }),
      makeContract({ type: "CALL", strike: 90, delta: 0.15, bid: 0.40, ask: 0.60 }),
    ],
    puts: [
      makeContract({ type: "PUT", strike: 83, delta: -0.30, bid: 0.90, ask: 1.10 }),
      makeContract({ type: "PUT", strike: 80, delta: -0.15, bid: 0.30, ask: 0.50 }),
    ],
    ...overrides,
  };
}

const defaultPolicy: OpportunityPolicy = {
  targetDelta: 0.30,
  minYieldThreshold: 8.0,
  maxCapitalPerContract: null,
};

// --- Tests ---

describe("deriveOpportunityRow", () => {
  it("derives a complete row from a well-formed chain", () => {
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, defaultPolicy);

    expect(row.symbol).toBe("XLE");
    expect(row.price).toBe(85.00);
    expect(row.optionsAvailable).toBe(true);
    expect(row.nearestExpiration).toBe("2026-07-18");
    expect(row.nearestDte).toBe(14);
    expect(row.greeksAvailable).toBe(true);
    expect(row.dataSource).toBe("api");
  });

  it("selects contract closest to target delta for calls", () => {
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, defaultPolicy);

    // The 0.30 delta call has bid=1.10, ask=1.30, mid=1.20
    expect(row.callDelta).toBe(0.30);
    expect(row.callMid).toBeCloseTo(1.20, 2);
  });

  it("selects contract closest to target delta for puts", () => {
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, defaultPolicy);

    // The -0.30 delta put has bid=0.90, ask=1.10, mid=1.00
    expect(row.putDelta).toBeCloseTo(0.30, 2); // stored as absolute value
    expect(row.putMid).toBeCloseTo(1.00, 2);
  });

  it("computes annualized yield for calls using underlying price as collateral", () => {
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, defaultPolicy);

    // callMid = 1.20, price = 85, dte = 14
    // yield = (1.20 / 85) * (365 / 14) * 100 = ~36.8%
    expect(row.callYield).toBeGreaterThan(30);
    expect(row.callYield).toBeLessThan(40);
  });

  it("computes annualized yield for puts using strike as collateral", () => {
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, defaultPolicy);

    // putMid = 1.00, strike = 83, dte = 14
    // yield = (1.00 / 83) * (365 / 14) * 100 = ~31.4%
    expect(row.putYield).toBeGreaterThan(25);
    expect(row.putYield).toBeLessThan(40);
  });

  it("computes capital per contract from put strike", () => {
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, defaultPolicy);

    // Closest put strike is 83
    expect(row.capitalPerContract).toBe(8300);
  });

  it("classifies as interesting when yield exceeds threshold", () => {
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, defaultPolicy);

    expect(row.status).toBe("interesting");
    expect(row.statusReason).toContain("exceeds");
  });

  it("classifies as monitor when yield is positive but below threshold", () => {
    // Use a very high threshold
    const strictPolicy: OpportunityPolicy = { ...defaultPolicy, minYieldThreshold: 50 };
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, strictPolicy);

    expect(row.status).toBe("monitor");
    expect(row.statusReason).toContain("below");
  });

  it("classifies as ineligible when capital exceeds limit", () => {
    const cappedPolicy: OpportunityPolicy = { ...defaultPolicy, maxCapitalPerContract: 5000 };
    const row = deriveOpportunityRow("XLE", makeChain(), "2026-07-18", 14, cappedPolicy);

    // Capital is 8300, limit is 5000
    expect(row.status).toBe("ineligible");
    expect(row.statusReason).toContain("exceeds limit");
  });

  it("classifies as data_missing when no greeks available", () => {
    const chain = makeChain({
      dataQuality: { greeksAvailable: false, dataSource: "api" },
    });
    const row = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, defaultPolicy);

    expect(row.status).toBe("data_missing");
    expect(row.statusReason).toContain("Greeks unavailable");
    expect(row.greeksAvailable).toBe(false);
    expect(row.callDelta).toBeNull();
    expect(row.putDelta).toBeNull();
  });

  it("classifies as data_missing when chain is empty", () => {
    const chain = makeChain({ calls: [], puts: [] });
    const row = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, defaultPolicy);

    expect(row.status).toBe("data_missing");
    expect(row.statusReason).toContain("No options contracts");
  });

  it("classifies as data_missing when price is zero", () => {
    const chain = makeChain({
      underlying: { symbol: "XLE", name: "Energy", price: 0 },
    });
    const row = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, defaultPolicy);

    expect(row.status).toBe("data_missing");
    expect(row.statusReason).toContain("Price unavailable");
  });

  it("handles chain with only calls (no puts)", () => {
    const chain = makeChain({ puts: [] });
    const row = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, defaultPolicy);

    expect(row.optionsAvailable).toBe(true);
    expect(row.callMid).not.toBeNull();
    expect(row.putMid).toBeNull();
    expect(row.putYield).toBeNull();
    // Capital falls back to price * 100 when no puts
    expect(row.capitalPerContract).toBe(85 * 100);
  });

  it("handles chain with only puts (no calls)", () => {
    const chain = makeChain({ calls: [] });
    const row = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, defaultPolicy);

    expect(row.optionsAvailable).toBe(true);
    expect(row.putMid).not.toBeNull();
    expect(row.callMid).toBeNull();
    expect(row.callYield).toBeNull();
  });

  it("respects dataSource from chain quality metadata", () => {
    const chain = makeChain({
      dataQuality: { greeksAvailable: true, dataSource: "cache" },
    });
    const row = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, defaultPolicy);

    expect(row.dataSource).toBe("cache");
  });
});

describe("policy sensitivity: same evidence + different policy = different opportunity row", () => {
  const chain = makeChain();
  // Chain has calls at delta 0.30 (strike 87, mid 1.20) and delta 0.15 (strike 90, mid 0.50)
  // Chain has puts at delta -0.30 (strike 83, mid 1.00) and delta -0.15 (strike 80, mid 0.40)

  const policy030: OpportunityPolicy = { targetDelta: 0.30, minYieldThreshold: 8.0, maxCapitalPerContract: null };
  const policy015: OpportunityPolicy = { targetDelta: 0.15, minYieldThreshold: 8.0, maxCapitalPerContract: null };

  it("selects different call contract when target delta changes", () => {
    const row030 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy030);
    const row015 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy015);

    // delta 0.30 should select the $87 call (delta=0.30, mid=1.20)
    expect(row030.callDelta).toBe(0.30);
    expect(row030.callMid).toBeCloseTo(1.20, 2);

    // delta 0.15 should select the $90 call (delta=0.15, mid=0.50)
    expect(row015.callDelta).toBe(0.15);
    expect(row015.callMid).toBeCloseTo(0.50, 2);
  });

  it("selects different put contract when target delta changes", () => {
    const row030 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy030);
    const row015 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy015);

    // delta 0.30 should select the $83 put (delta=-0.30, mid=1.00)
    expect(row030.putDelta).toBeCloseTo(0.30, 2);
    expect(row030.putMid).toBeCloseTo(1.00, 2);

    // delta 0.15 should select the $80 put (delta=-0.15, mid=0.40)
    expect(row015.putDelta).toBeCloseTo(0.15, 2);
    expect(row015.putMid).toBeCloseTo(0.40, 2);
  });

  it("produces different yields from same evidence under different policy", () => {
    const row030 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy030);
    const row015 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy015);

    // Yields must differ because different contracts are selected
    expect(row030.callYield).not.toBe(row015.callYield);
    expect(row030.putYield).not.toBe(row015.putYield);

    // Higher delta generally means higher premium, thus higher yield
    expect(row030.callYield!).toBeGreaterThan(row015.callYield!);
    expect(row030.putYield!).toBeGreaterThan(row015.putYield!);
  });

  it("produces different capital/contract because put strike changes", () => {
    const row030 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy030);
    const row015 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy015);

    // delta 0.30 → strike 83 → capital 8300
    expect(row030.capitalPerContract).toBe(8300);

    // delta 0.15 → strike 80 → capital 8000
    expect(row015.capitalPerContract).toBe(8000);
  });

  it("same evidence + same policy = same row (deterministic)", () => {
    const row1 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy030);
    const row2 = deriveOpportunityRow("XLE", chain, "2026-07-18", 14, policy030);

    expect(row1.callYield).toBe(row2.callYield);
    expect(row1.putYield).toBe(row2.putYield);
    expect(row1.capitalPerContract).toBe(row2.capitalPerContract);
    expect(row1.status).toBe(row2.status);
  });
});
