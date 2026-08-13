/**
 * Strike-to-Market Consequence — Semantic Tests
 *
 * The put popup's impatient-mode answer is:
 *   "If assigned NOW at the current market price, what is the immediate capital loss?"
 *
 * Calculation: max(strike - currentUnderlyingPrice, 0) × 100 × quantity
 *
 * Invariants:
 * - ITM put: correct capital loss based on strike-to-market difference
 * - OTM put: zero capital loss (no negative "loss")
 * - Multiple contracts: quantity × 100 multiplier
 * - Missing price: unavailable, not fabricated
 * - Premium is NOT subtracted from the headline capital loss figure
 */

import { describe, it, expect } from "vitest";
import { buildPositionDetail } from "../../src/portfolio/position-detail";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";

function createPutPosition(overrides: Partial<MonitoredPosition> = {}): MonitoredPosition {
  return {
    id: "put-PSI-155-2026-08-22",
    type: "put",
    underlying: "PSI",
    strike: 155,
    expiration: "2026-08-22",
    dte: 9,
    quantity: 1,
    encumberedCapital: 15500,
    capitalValuationBasis: "strike",
    capitalAsOf: "2026-08-13",
    moneyness: null,
    underlyingPrice: null,
    priceObservedAt: null,
    evidenceGeneration: null,
    acquisitionStatus: null,
    lastAttemptAt: null,
    failureCount: 0,
    ...overrides,
  };
}

describe("Put: Strike-to-Market Capital Loss", () => {

  it("ITM put: correct capital loss when underlying is below strike", () => {
    // PSI example: strike $155, current price $151.75, qty 1
    // Expected: ($155 - $151.75) × 100 × 1 = $325
    const position = createPutPosition({
      underlyingPrice: 151.75,
      moneyness: (155 - 151.75) / 155, // positive = ITM for puts
    });

    const detail = buildPositionDetail(position, null, null, { brokerOptionBasis: -200, brokerOptionAverageCost: -2.00 });

    expect(detail.strikeToMarketConsequence).not.toBeNull();
    expect(detail.strikeToMarketConsequence!.capitalLoss.value).toBe(325);
    expect(detail.strikeToMarketConsequence!.isITM).toBe(true);
    expect(detail.strikeToMarketConsequence!.atPrice).toBe(151.75);
  });

  it("OTM put: zero capital loss when underlying is above strike", () => {
    // Put at $155, underlying at $160 — OTM, no assignment consequence
    const position = createPutPosition({
      underlyingPrice: 160,
      moneyness: (155 - 160) / 155, // negative = OTM for puts
    });

    const detail = buildPositionDetail(position, null, null, { brokerOptionBasis: -200, brokerOptionAverageCost: -2.00 });

    expect(detail.strikeToMarketConsequence).not.toBeNull();
    expect(detail.strikeToMarketConsequence!.capitalLoss.value).toBe(0);
    expect(detail.strikeToMarketConsequence!.isITM).toBe(false);
  });

  it("multiple contracts: quantity × 100 multiplier applied correctly", () => {
    // Strike $50, underlying $48, quantity 3
    // Expected: ($50 - $48) × 100 × 3 = $600
    const position = createPutPosition({
      strike: 50,
      underlyingPrice: 48,
      quantity: 3,
      moneyness: (50 - 48) / 50,
    });

    const detail = buildPositionDetail(position, null, null, { brokerOptionBasis: null, brokerOptionAverageCost: null });

    expect(detail.strikeToMarketConsequence!.capitalLoss.value).toBe(600);
  });

  it("missing underlying price: consequence is unavailable, not fabricated", () => {
    const position = createPutPosition({
      underlyingPrice: null, // no market observation
      moneyness: null,
    });

    const detail = buildPositionDetail(position, null, null, { brokerOptionBasis: -200, brokerOptionAverageCost: -2.00 });

    expect(detail.strikeToMarketConsequence).not.toBeNull();
    expect(detail.strikeToMarketConsequence!.capitalLoss.value).toBeNull();
    expect(detail.strikeToMarketConsequence!.capitalLoss.provenance).toBe("unavailable");
  });

  it("premium is NOT subtracted from the headline capital loss", () => {
    // Strike $155, underlying $151.75, premium received $2.00/share ($200 total)
    // The capital loss is $325, NOT $325 - $200 = $125
    // Premium remains a separate economic concept (production, not loss offset)
    const position = createPutPosition({
      underlyingPrice: 151.75,
      moneyness: (155 - 151.75) / 155,
    });

    const detail = buildPositionDetail(position, null, null, { brokerOptionBasis: -200, brokerOptionAverageCost: -2.00 });

    // Capital loss is the raw strike-to-market difference
    expect(detail.strikeToMarketConsequence!.capitalLoss.value).toBe(325);

    // Premium exists separately in the consequence model
    expect(detail.consequence.type).toBe("put");
    if (detail.consequence.type === "put") {
      expect(detail.consequence.premiumCredit.value).toBe(200);
    }
  });

  it("ATM put (underlying exactly at strike): zero capital loss", () => {
    const position = createPutPosition({
      underlyingPrice: 155, // exactly at strike
      moneyness: 0,
    });

    const detail = buildPositionDetail(position, null, null, { brokerOptionBasis: null, brokerOptionAverageCost: null });

    expect(detail.strikeToMarketConsequence!.capitalLoss.value).toBe(0);
    expect(detail.strikeToMarketConsequence!.isITM).toBe(false);
  });

  it("only puts have strikeToMarketConsequence (calls return null)", () => {
    const callPosition: MonitoredPosition = {
      ...createPutPosition(),
      id: "call-XLE-50-2026-08-22",
      type: "call",
      underlying: "XLE",
      strike: 50,
      underlyingPrice: 48,
    };

    const detail = buildPositionDetail(callPosition, null, null, { brokerOptionBasis: null, brokerOptionAverageCost: null });

    expect(detail.strikeToMarketConsequence).toBeNull();
  });
});

describe("Instrument Description Lookup", () => {
  it("passes instrument description through to PositionDetail", () => {
    const position = createPutPosition({ underlyingPrice: 151.75 });

    const detail = buildPositionDetail(
      position, null, null,
      { brokerOptionBasis: null, brokerOptionAverageCost: null },
      "U.S. semiconductor manufacturers, smart-beta methodology"
    );

    expect(detail.instrumentDescription).toBe("U.S. semiconductor manufacturers, smart-beta methodology");
  });

  it("null description when not provided", () => {
    const position = createPutPosition({ underlyingPrice: 151.75 });

    const detail = buildPositionDetail(
      position, null, null,
      { brokerOptionBasis: null, brokerOptionAverageCost: null }
    );

    expect(detail.instrumentDescription).toBeNull();
  });
});
