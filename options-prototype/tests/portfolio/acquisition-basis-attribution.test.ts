/**
 * Acquisition Basis Attribution Tests
 *
 * Validates the Activity-derived per-call BW acquisition basis mechanism:
 * - enrichBuyWriteOrigin captures acquisition price and classifies confidence
 * - deriveCallAssignmentConsequence respects the precedence hierarchy
 * - GDXJ/BNO-style multi-lot scenarios produce correct per-call attribution
 *
 * Confidence tiers:
 * - "unique": one-to-one mapping from Activity evidence
 * - "batch": same-day batch with multiple calls; VWAP basis
 * - (no acquisitionBasis): falls to symbol-level blended or unavailable
 */

import { describe, it, expect } from "vitest";
import {
  deriveCallAssignmentConsequence,
  derivePutAssignmentConsequence,
  type OptionBasisInput,
} from "../../src/portfolio/assignment-consequence";
import { projectActivityOverlay, parseCheckpoint } from "../../src/portfolio/activity-projection";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";
import type { InventoryPosition, PortfolioSnapshot, OpenShortCall, CallAcquisitionBasis } from "../../src/write-desk/types";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";

// --- Helpers ---

function makeCallPosition(overrides?: Partial<MonitoredPosition>): MonitoredPosition {
  return {
    id: "call-test",
    type: "buy-write",
    underlying: "GDXJ",
    strike: 120,
    expiration: "2026-09-04",
    dte: 14,
    quantity: 1,
    encumberedCapital: 12000,
    capitalValuationBasis: "market-value-at-import",
    capitalAsOf: "2026-08-20",
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

function makeInventory(overrides?: Partial<InventoryPosition>): InventoryPosition {
  return {
    symbol: "GDXJ",
    sharesOwned: 200,
    sharesEncumbered: 200,
    sharesFree: 0,
    maxAdditionalContracts: 0,
    economics: { averageCostPerShare: 124.03, costBasis: 24806, marketValue: 25000 },
    ...overrides,
  };
}

const noOptionBasis: OptionBasisInput = { brokerOptionBasis: null, brokerOptionAverageCost: null };

function makeBaseSnapshot(overrides?: Partial<PortfolioSnapshot>): PortfolioSnapshot {
  return {
    id: "test",
    source: { type: "fidelity", label: "Test" },
    accountId: "TEST",
    snapshotDate: "2026-08-20",
    inventory: [],
    existingCalls: [],
    existingPuts: [],
    deployableCash: 50000,
    aggregateShortOptionMTM: null,
    balanceContext: null,
    provenance: { sourceType: "fidelity", sourceLabel: "Test", createdAt: "2026-08-20T00:00:00Z" },
    readiness: { status: "READY", optionSummaryLoaded: true, balancesLoaded: true, inventoryValid: true, cashStateValid: true, timestampsReconciled: true, timeSeparationMinutes: 0, warnings: [], blockReasons: [] },
    ...overrides,
  };
}

function makeActivityRow(overrides: Partial<ActivityRow>): ActivityRow {
  return {
    date: "2026-08-12",
    eventType: "other",
    action: "",
    symbol: "",
    description: "",
    quantity: 0,
    price: null,
    commission: null,
    fees: null,
    amount: null,
    cashBalance: null,
    settlementDate: null,
    option: null,
    rawRow: [],
    ...overrides,
  };
}

// --- deriveCallAssignmentConsequence precedence tests ---

describe("deriveCallAssignmentConsequence — acquisition basis precedence", () => {

  it("unique Activity-attributed basis produces activity-attributed provenance", () => {
    const position = makeCallPosition({ strike: 120, quantity: 1 });
    const inventory = makeInventory(); // blended: $124.03
    const basis: CallAcquisitionBasis = { pricePerShare: 119.60, shares: 100, date: "2026-08-12", confidence: "unique" };

    const result = deriveCallAssignmentConsequence(position, inventory, noOptionBasis, basis);

    expect(result.brokerShareBasis.value).toBeCloseTo(119.60);
    expect(result.brokerShareBasis.provenance).toBe("activity-attributed");
    expect(result.appreciationPerShare.value).toBeCloseTo(0.40); // 120 - 119.60
    expect(result.totalAppreciationOrErosion.value).toBeCloseTo(40); // 0.40 × 100
  });

  it("batch Activity-attributed basis produces batch-attributed provenance", () => {
    const position = makeCallPosition({ strike: 120, quantity: 1 });
    const inventory = makeInventory();
    const basis: CallAcquisitionBasis = { pricePerShare: 119.80, shares: 100, date: "2026-08-12", confidence: "batch" };

    const result = deriveCallAssignmentConsequence(position, inventory, noOptionBasis, basis);

    expect(result.brokerShareBasis.value).toBeCloseTo(119.80);
    expect(result.brokerShareBasis.provenance).toBe("batch-attributed");
    expect(result.appreciationPerShare.value).toBeCloseTo(0.20);
    expect(result.totalAppreciationOrErosion.value).toBeCloseTo(20);
  });

  it("Activity-attributed basis takes precedence over symbol-level blended", () => {
    const position = makeCallPosition({ strike: 120, quantity: 1 });
    // Blended says $124.03 → would show erosion of −$403
    const inventory = makeInventory({ economics: { averageCostPerShare: 124.03, costBasis: 24806, marketValue: 25000 } });
    // Activity says $119.60 → shows appreciation of +$40
    const basis: CallAcquisitionBasis = { pricePerShare: 119.60, shares: 100, date: "2026-08-12", confidence: "unique" };

    const result = deriveCallAssignmentConsequence(position, inventory, noOptionBasis, basis);

    // Must use Activity basis, NOT the blended $124.03
    expect(result.brokerShareBasis.value).toBeCloseTo(119.60);
    expect(result.totalAppreciationOrErosion.value).toBeCloseTo(40); // NOT −403
  });

  it("without acquisitionBasis, falls to symbol-level blended (observed provenance)", () => {
    const position = makeCallPosition({ strike: 120, quantity: 1 });
    const inventory = makeInventory();

    const result = deriveCallAssignmentConsequence(position, inventory, noOptionBasis);

    expect(result.brokerShareBasis.value).toBeCloseTo(124.03);
    expect(result.brokerShareBasis.provenance).toBe("observed");
    // Erosion from blended: 120 - 124.03 = −4.03/share
    expect(result.appreciationPerShare.value).toBeCloseTo(-4.03);
  });

  it("without acquisitionBasis and no inventory economics, provenance is unavailable", () => {
    const position = makeCallPosition({ strike: 120, quantity: 1 });
    const inventory = makeInventory({ economics: null });

    const result = deriveCallAssignmentConsequence(position, inventory, noOptionBasis);

    expect(result.brokerShareBasis.value).toBeNull();
    expect(result.brokerShareBasis.provenance).toBe("unavailable");
    expect(result.totalAppreciationOrErosion.value).toBeNull();
  });

  it("erosion with unique attribution shows negative values correctly", () => {
    // BNO case: basis $51.42, strike $51 → erosion of $0.42/share
    const position = makeCallPosition({ underlying: "BNO", strike: 51, quantity: 1 });
    const basis: CallAcquisitionBasis = { pricePerShare: 51.42, shares: 100, date: "2026-08-10", confidence: "unique" };

    const result = deriveCallAssignmentConsequence(position, null, noOptionBasis, basis);

    expect(result.brokerShareBasis.value).toBeCloseTo(51.42);
    expect(result.brokerShareBasis.provenance).toBe("activity-attributed");
    expect(result.appreciationPerShare.value).toBeCloseTo(-0.42);
    expect(result.totalAppreciationOrErosion.value).toBeCloseTo(-42);
  });
});

// --- enrichBuyWriteOrigin confidence classification tests ---

describe("enrichBuyWriteOrigin — acquisition basis confidence classification", () => {

  it("GDXJ pattern: two BWs on different days → both get unique attribution with different prices", () => {
    // GDXJ: Lot 1 purchased Day-A at $119.60, Lot 2 purchased Day-B at $128.46
    const baseSnapshot = makeBaseSnapshot({
      inventory: [{ symbol: "GDXJ", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 124.03, costBasis: 24806, marketValue: 25000 } }],
      existingCalls: [
        { symbol: "-GDXJ260904C120", underlying: "GDXJ", strike: 120, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -350, brokerOptionAverageCost: -3.50 },
        { symbol: "-GDXJ260911C129", underlying: "GDXJ", strike: 129, expiration: "2026-09-11", quantity: 1, brokerOptionBasis: -250, brokerOptionAverageCost: -2.50 },
      ],
    });

    const activity: ActivityRow[] = [
      // Day A: buy 100 GDXJ at $119.60 + STO $120 call Sep 4
      makeActivityRow({ date: "2026-08-12", eventType: "shares_bought_direct", symbol: "GDXJ", quantity: 100, price: 119.60, amount: -11960 }),
      makeActivityRow({ date: "2026-08-12", eventType: "sell_to_open", symbol: "-GDXJ260904C120", quantity: -1, price: 3.50, amount: 350, option: { underlying: "GDXJ", strike: 120, expiration: "2026-09-04", type: "CALL" } }),
      // Day B: buy 100 GDXJ at $128.46 + STO $129 call Sep 11
      makeActivityRow({ date: "2026-08-16", eventType: "shares_bought_direct", symbol: "GDXJ", quantity: 100, price: 128.46, amount: -12846 }),
      makeActivityRow({ date: "2026-08-16", eventType: "sell_to_open", symbol: "-GDXJ260911C129", quantity: -1, price: 2.50, amount: 250, option: { underlying: "GDXJ", strike: 129, expiration: "2026-09-11", type: "CALL" } }),
    ];

    const checkpoint = parseCheckpoint("08/11/2026");
    const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

    const call120 = projected.existingCalls.find(c => c.strike === 120);
    const call129 = projected.existingCalls.find(c => c.strike === 129);

    // Both tagged as BW
    expect(call120!.origin).toBe("buy-write");
    expect(call129!.origin).toBe("buy-write");

    // Both have unique attribution with different prices
    expect(call120!.acquisitionBasis).toBeDefined();
    expect(call120!.acquisitionBasis!.confidence).toBe("unique");
    expect(call120!.acquisitionBasis!.pricePerShare).toBeCloseTo(119.60);
    expect(call120!.acquisitionBasis!.date).toBe("2026-08-12");

    expect(call129!.acquisitionBasis).toBeDefined();
    expect(call129!.acquisitionBasis!.confidence).toBe("unique");
    expect(call129!.acquisitionBasis!.pricePerShare).toBeCloseTo(128.46);
    expect(call129!.acquisitionBasis!.date).toBe("2026-08-16");
  });

  it("BNO pattern: BW + non-BW call on same symbol → only BW gets attribution", () => {
    const baseSnapshot = makeBaseSnapshot({
      inventory: [{ symbol: "BNO", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 51.00, costBasis: 10200, marketValue: 10400 } }],
      existingCalls: [
        { symbol: "-BNO260904C51", underlying: "BNO", strike: 51, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -284, brokerOptionAverageCost: -2.84 },
        { symbol: "-BNO260911C52", underlying: "BNO", strike: 52, expiration: "2026-09-11", quantity: 1, brokerOptionBasis: -150, brokerOptionAverageCost: -1.50 },
      ],
    });

    const activity: ActivityRow[] = [
      // Only Sep 4 call has same-day purchase evidence
      makeActivityRow({ date: "2026-08-10", eventType: "shares_bought_direct", symbol: "BNO", quantity: 100, price: 51.42, amount: -5142 }),
      makeActivityRow({ date: "2026-08-10", eventType: "sell_to_open", symbol: "-BNO260904C51", quantity: -1, price: 2.84, amount: 284, option: { underlying: "BNO", strike: 51, expiration: "2026-09-04", type: "CALL" } }),
      // Sep 11 call STO on a different day, no same-day purchase
      makeActivityRow({ date: "2026-08-14", eventType: "sell_to_open", symbol: "-BNO260911C52", quantity: -1, price: 1.50, amount: 150, option: { underlying: "BNO", strike: 52, expiration: "2026-09-11", type: "CALL" } }),
    ];

    const checkpoint = parseCheckpoint("08/09/2026");
    const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

    const callSep4 = projected.existingCalls.find(c => c.strike === 51);
    const callSep11 = projected.existingCalls.find(c => c.strike === 52);

    // Sep 4: BW with unique attribution
    expect(callSep4!.origin).toBe("buy-write");
    expect(callSep4!.acquisitionBasis).toBeDefined();
    expect(callSep4!.acquisitionBasis!.confidence).toBe("unique");
    expect(callSep4!.acquisitionBasis!.pricePerShare).toBeCloseTo(51.42);

    // Sep 11: NOT BW, no acquisition basis
    expect(callSep11!.origin).not.toBe("buy-write");
    expect(callSep11!.acquisitionBasis).toBeUndefined();
  });

  it("same-day multi-BW with single uniform fill → unique confidence for all", () => {
    // Buy 200 shares in one fill + write 2 calls at different strikes
    const baseSnapshot = makeBaseSnapshot({
      existingCalls: [
        { symbol: "-EWY260904C185", underlying: "EWY", strike: 185, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -750, brokerOptionAverageCost: -7.50 },
        { symbol: "-EWY260904C190", underlying: "EWY", strike: 190, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -400, brokerOptionAverageCost: -4.00 },
      ],
    });

    const activity: ActivityRow[] = [
      // One purchase of 200 shares at uniform price
      makeActivityRow({ date: "2026-08-15", eventType: "shares_bought_direct", symbol: "EWY", quantity: 200, price: 179.29, amount: -35858 }),
      // Two calls written same day
      makeActivityRow({ date: "2026-08-15", eventType: "sell_to_open", symbol: "-EWY260904C185", quantity: -1, price: 7.50, amount: 750, option: { underlying: "EWY", strike: 185, expiration: "2026-09-04", type: "CALL" } }),
      makeActivityRow({ date: "2026-08-15", eventType: "sell_to_open", symbol: "-EWY260904C190", quantity: -1, price: 4.00, amount: 400, option: { underlying: "EWY", strike: 190, expiration: "2026-09-04", type: "CALL" } }),
    ];

    const checkpoint = parseCheckpoint("08/14/2026");
    const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

    const call185 = projected.existingCalls.find(c => c.strike === 185);
    const call190 = projected.existingCalls.find(c => c.strike === 190);

    // Both BW, both unique (single uniform fill covers all)
    expect(call185!.origin).toBe("buy-write");
    expect(call185!.acquisitionBasis!.confidence).toBe("unique");
    expect(call185!.acquisitionBasis!.pricePerShare).toBeCloseTo(179.29);

    expect(call190!.origin).toBe("buy-write");
    expect(call190!.acquisitionBasis!.confidence).toBe("unique");
    expect(call190!.acquisitionBasis!.pricePerShare).toBeCloseTo(179.29);
  });

  it("same-day multi-BW with multiple fills at different prices → batch confidence", () => {
    // Two partial fills at different prices + two calls
    const baseSnapshot = makeBaseSnapshot({
      existingCalls: [
        { symbol: "-XYZ260904C50", underlying: "XYZ", strike: 50, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -200, brokerOptionAverageCost: -2.00 },
        { symbol: "-XYZ260904C52", underlying: "XYZ", strike: 52, expiration: "2026-09-04", quantity: 1, brokerOptionBasis: -150, brokerOptionAverageCost: -1.50 },
      ],
    });

    const activity: ActivityRow[] = [
      // Two fills at different prices (partial fills)
      makeActivityRow({ date: "2026-08-15", eventType: "shares_bought_direct", symbol: "XYZ", quantity: 100, price: 48.50, amount: -4850 }),
      makeActivityRow({ date: "2026-08-15", eventType: "shares_bought_direct", symbol: "XYZ", quantity: 100, price: 49.20, amount: -4920 }),
      // Two calls written same day, same underlying
      makeActivityRow({ date: "2026-08-15", eventType: "sell_to_open", symbol: "-XYZ260904C50", quantity: -1, price: 2.00, amount: 200, option: { underlying: "XYZ", strike: 50, expiration: "2026-09-04", type: "CALL" } }),
      makeActivityRow({ date: "2026-08-15", eventType: "sell_to_open", symbol: "-XYZ260904C52", quantity: -1, price: 1.50, amount: 150, option: { underlying: "XYZ", strike: 52, expiration: "2026-09-04", type: "CALL" } }),
    ];

    const checkpoint = parseCheckpoint("08/14/2026");
    const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

    const call50 = projected.existingCalls.find(c => c.strike === 50);
    const call52 = projected.existingCalls.find(c => c.strike === 52);

    // Both BW, both batch (multiple fills at different prices, multiple calls)
    expect(call50!.origin).toBe("buy-write");
    expect(call50!.acquisitionBasis!.confidence).toBe("batch");
    // VWAP: (100*48.50 + 100*49.20) / 200 = 48.85
    expect(call50!.acquisitionBasis!.pricePerShare).toBeCloseTo(48.85);

    expect(call52!.origin).toBe("buy-write");
    expect(call52!.acquisitionBasis!.confidence).toBe("batch");
    expect(call52!.acquisitionBasis!.pricePerShare).toBeCloseTo(48.85);
  });

  it("call without BW origin does not receive acquisitionBasis", () => {
    // Pre-existing shares, call written later (no same-day purchase)
    const baseSnapshot = makeBaseSnapshot({
      inventory: [{ symbol: "XLE", sharesOwned: 200, sharesEncumbered: 200, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 55.00, costBasis: 11000, marketValue: 12000 } }],
      existingCalls: [
        { symbol: "-XLE260905C60", underlying: "XLE", strike: 60, expiration: "2026-09-05", quantity: 2, brokerOptionBasis: -220, brokerOptionAverageCost: -1.10 },
      ],
    });

    const activity: ActivityRow[] = [
      // Only the STO — no same-day share purchase
      makeActivityRow({ date: "2026-08-19", eventType: "sell_to_open", symbol: "-XLE260905C60", quantity: -2, price: 1.10, amount: 220, option: { underlying: "XLE", strike: 60, expiration: "2026-09-05", type: "CALL" } }),
    ];

    const checkpoint = parseCheckpoint("08/18/2026");
    const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

    const xleCall = projected.existingCalls.find(c => c.underlying === "XLE");
    expect(xleCall!.origin).not.toBe("buy-write");
    expect(xleCall!.acquisitionBasis).toBeUndefined();
  });

  it("enrichment on pre-existing Option Summary calls also attaches acquisition basis", () => {
    // Call exists from Option Summary (pre-checkpoint). Activity proves BW origin.
    const baseSnapshot = makeBaseSnapshot({
      inventory: [{ symbol: "DBO", sharesOwned: 100, sharesEncumbered: 100, sharesFree: 0, maxAdditionalContracts: 0, economics: { averageCostPerShare: 22.50, costBasis: 2250, marketValue: 2300 } }],
      existingCalls: [
        { symbol: "-DBO260821C23", underlying: "DBO", strike: 23, expiration: "2026-08-21", quantity: 1, brokerOptionBasis: -80, brokerOptionAverageCost: -0.80 },
      ],
    });

    const activity: ActivityRow[] = [
      // BW entry happened before the checkpoint (Option Summary already includes it)
      makeActivityRow({ date: "2026-08-08", eventType: "shares_bought_direct", symbol: "DBO", quantity: 100, price: 22.50, amount: -2250 }),
      makeActivityRow({ date: "2026-08-08", eventType: "sell_to_open", symbol: "-DBO260821C23", quantity: -1, price: 0.80, amount: 80, option: { underlying: "DBO", strike: 23, expiration: "2026-08-21", type: "CALL" } }),
    ];

    const checkpoint = parseCheckpoint("08/20/2026");
    const { snapshot: projected } = projectActivityOverlay(baseSnapshot, activity, checkpoint.timestamp, checkpoint.precision);

    const dboCall = projected.existingCalls.find(c => c.underlying === "DBO");
    expect(dboCall!.origin).toBe("buy-write");
    expect(dboCall!.acquisitionBasis).toBeDefined();
    expect(dboCall!.acquisitionBasis!.confidence).toBe("unique");
    expect(dboCall!.acquisitionBasis!.pricePerShare).toBeCloseTo(22.50);
  });
});


// --- Premium Booked / Put Semantics / Popup Terminology Tests ---

describe("premium booked evidence — canonical derivation", () => {

  it("premium credit matches abs(brokerOptionBasis) for calls", () => {
    const position = makeCallPosition({ strike: 120, quantity: 1 });
    const inventory = makeInventory();
    const optionBasis: OptionBasisInput = { brokerOptionBasis: -350, brokerOptionAverageCost: -3.50 };
    const basis: CallAcquisitionBasis = { pricePerShare: 119.60, shares: 100, date: "2026-08-12", confidence: "unique" };

    const result = deriveCallAssignmentConsequence(position, inventory, optionBasis, basis);

    // Premium credit = abs(-350) = 350
    expect(result.premiumCredit.value).toBe(350);
    expect(result.premiumCredit.provenance).toBe("derived");
    // Premium per share = abs(-3.50) = 3.50
    expect(result.premiumCreditPerShare.value).toBe(3.50);
  });

  it("premium is unavailable when brokerOptionBasis is null", () => {
    const position = makeCallPosition({ strike: 120, quantity: 1 });
    const basis: CallAcquisitionBasis = { pricePerShare: 119.60, shares: 100, date: "2026-08-12", confidence: "unique" };

    const result = deriveCallAssignmentConsequence(position, null, noOptionBasis, basis);

    expect(result.premiumCredit.value).toBeNull();
    expect(result.premiumCredit.provenance).toBe("unavailable");
  });

  it("premium credit is same evidence path used by popup and production", () => {
    // Proves the column and popup consume the same canonical derivation
    const position = makeCallPosition({ underlying: "EWY", strike: 185, quantity: 1 });
    const optionBasis: OptionBasisInput = { brokerOptionBasis: -750, brokerOptionAverageCost: -7.50 };
    const basis: CallAcquisitionBasis = { pricePerShare: 179.29, shares: 100, date: "2026-08-15", confidence: "unique" };

    const result = deriveCallAssignmentConsequence(position, null, optionBasis, basis);

    expect(result.premiumCredit.value).toBe(750);
    expect(result.premiumCreditPerShare.value).toBe(7.50);
    // brokerOptionBasis preserved as observed fact
    expect(result.brokerOptionBasis.value).toBe(-750);
    expect(result.brokerOptionBasis.provenance).toBe("observed");
  });
});

describe("put assignment consequence — cash→equity semantics", () => {
  it("put assignment produces positive cash consumed (not negative loss)", () => {
    const position = makeCallPosition({
      id: "put-URA-35",
      type: "put",
      underlying: "URA",
      strike: 35,
      quantity: 2,
    });
    const optionBasis: OptionBasisInput = { brokerOptionBasis: -310, brokerOptionAverageCost: -1.55 };

    const result = derivePutAssignmentConsequence(position, null, optionBasis);

    // Cash consumed is a positive mechanical fact: strike × shares
    expect(result.cashConsumed).toBe(7000); // $35 × 200 shares
    expect(result.sharesAcquired).toBe(200); // 2 contracts × 100
    expect(result.acquisitionPricePerShare).toBe(35);
    // Premium is separately preserved
    expect(result.premiumCredit.value).toBe(310);
  });

  it("put assignment does not encode cash conversion as a loss", () => {
    const position = makeCallPosition({
      id: "put-PSI-155",
      type: "put",
      underlying: "PSI",
      strike: 155,
      quantity: 1,
    });
    const optionBasis: OptionBasisInput = { brokerOptionBasis: -1149, brokerOptionAverageCost: -11.49 };

    const result = derivePutAssignmentConsequence(position, null, optionBasis);

    // $15,500 is the capital TRANSFORMATION amount (cash → equity), not a loss
    expect(result.cashConsumed).toBe(15500);
    expect(result.sharesAcquired).toBe(100);
    // Put obligation resolved equals the same amount
    expect(result.putObligationResolved).toBe(15500);
  });
});

describe("BW erosion rendering — attribution preserves correctness", () => {
  it("BNO erosion: Activity-attributed basis correctly shows small erosion", () => {
    // BNO: recommended at <$51, filled at $51.42, strike $51
    // True erosion: −$0.42/share × 100 = −$42
    const position = makeCallPosition({
      id: "bw-BNO-51",
      type: "buy-write",
      underlying: "BNO",
      strike: 51,
      quantity: 1,
    });
    const optionBasis: OptionBasisInput = { brokerOptionBasis: -284, brokerOptionAverageCost: -2.84 };
    const basis: CallAcquisitionBasis = { pricePerShare: 51.42, shares: 100, date: "2026-08-10", confidence: "unique" };

    const result = deriveCallAssignmentConsequence(position, null, optionBasis, basis);

    expect(result.brokerShareBasis.provenance).toBe("activity-attributed");
    expect(result.totalAppreciationOrErosion.value).toBeCloseTo(-42);
    // Premium still positive: the BW is net-positive when you include premium
    expect(result.premiumCredit.value).toBe(284);
    // Net: -42 + 284 = +242 (positive net economics despite equity erosion)
  });

  it("blended basis for multi-lot symbol does NOT render as call-specific", () => {
    // GDXJ with blended $124.03 — consequence derivation falls to observed/symbol-level
    const position = makeCallPosition({
      id: "call-GDXJ-120",
      type: "buy-write",
      underlying: "GDXJ",
      strike: 120,
      quantity: 1,
    });
    const inventory = makeInventory({ economics: { averageCostPerShare: 124.03, costBasis: 24806, marketValue: 25000 } });

    // No acquisitionBasis — falls to symbol-level
    const result = deriveCallAssignmentConsequence(position, inventory, noOptionBasis);

    // Still computes from blended, but provenance is "observed" (symbol-level)
    expect(result.brokerShareBasis.provenance).toBe("observed");
    expect(result.brokerShareBasis.value).toBeCloseTo(124.03);
    // The column rendering would suppress this — but the derivation still produces it
    // for the popup drill-down where it can be labeled appropriately
    expect(result.totalAppreciationOrErosion.value).toBeCloseTo(-403);
  });
});

describe("popup terminology — calls use 'called away', puts use 'assigned'", () => {
  // These tests verify the data model supports the distinction.
  // The actual React rendering uses consequence.type to branch.

  it("call consequence type is 'call' for both covered calls and buy-writes", () => {
    const ccPosition = makeCallPosition({ type: "call" });
    const bwPosition = makeCallPosition({ type: "buy-write" });
    const basis: CallAcquisitionBasis = { pricePerShare: 119.60, shares: 100, date: "2026-08-12", confidence: "unique" };

    const ccResult = deriveCallAssignmentConsequence(ccPosition, makeInventory(), noOptionBasis);
    const bwResult = deriveCallAssignmentConsequence(bwPosition, makeInventory(), noOptionBasis, basis);

    // Both produce consequence.type === "call" → popup uses "If Called Away"
    expect(ccResult.type).toBe("call");
    expect(bwResult.type).toBe("call");
  });

  it("put consequence type is 'put' → popup uses 'If Assigned'", () => {
    const putPosition = makeCallPosition({
      id: "put-test",
      type: "put",
      underlying: "URA",
      strike: 35,
      quantity: 1,
    });

    const result = derivePutAssignmentConsequence(putPosition, null, noOptionBasis);

    expect(result.type).toBe("put");
  });
});
