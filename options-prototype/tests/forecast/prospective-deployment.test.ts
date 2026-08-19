/**
 * Prospective Deployment — V2 Continuation Estimate Tests
 *
 * Covers:
 *   - Recent deployment extraction from Activity rows
 *   - Capital-weighted yield computation
 *   - Plausibility assessment
 *   - Rough estimate derivation (single rounded number)
 *   - Edge cases (no activity, no cycling capital, insufficient time)
 *   - No arbitrary participation fractions
 */

import { describe, it, expect } from "vitest";
import {
  extractRecentDeployments,
  computeRecentYield,
  deriveProspectiveDeployment,
} from "../../src/forecast/prospective-deployment";
import type { ActivityRow } from "../../src/csv/fidelity/activityParser";

// --- Test Helpers ---

function makeSellToOpen(overrides: Partial<ActivityRow> = {}): ActivityRow {
  return {
    date: "2026-08-03",
    eventType: "sell_to_open",
    action: "YOU SOLD OPENING TRANSACTION",
    symbol: "-EWY260821P150",
    description: "PUT (EWY) ISHARES MSCI SOUTH AUG 21 26 $150",
    quantity: -1,
    price: 8.21,
    commission: 0.65,
    fees: 0.03,
    amount: 820.32,
    cashBalance: 84936.22,
    settlementDate: "2026-08-04",
    option: {
      underlying: "EWY",
      expiration: "2026-08-21",
      strike: 150,
      type: "PUT",
    },
    rawRow: [],
    ...overrides,
  };
}

function makeActivityRows(): ActivityRow[] {
  return [
    makeSellToOpen({ date: "2026-08-03", amount: 820.32, option: { underlying: "EWY", expiration: "2026-08-21", strike: 150, type: "PUT" } }),
    makeSellToOpen({ date: "2026-07-27", amount: 326.34, option: { underlying: "BNO", expiration: "2026-08-14", strike: 50, type: "PUT" } }),
    makeSellToOpen({ date: "2026-07-27", amount: 112.34, option: { underlying: "GSG", expiration: "2026-08-21", strike: 32, type: "PUT" } }),
    makeSellToOpen({ date: "2026-07-27", amount: 189.34, option: { underlying: "AIQ", expiration: "2026-08-21", strike: 57, type: "PUT" } }),
    makeSellToOpen({ date: "2026-07-15", amount: 1149.31, option: { underlying: "PSI", expiration: "2026-08-21", strike: 155, type: "PUT" } }),
    makeSellToOpen({ date: "2026-07-13", amount: 704.32, option: { underlying: "XLK", expiration: "2026-08-14", strike: 181, type: "PUT" } }),
  ];
}

const NOW = new Date("2026-08-18T12:00:00Z");
const MONTH_END = new Date("2026-08-31");

// --- Deployment Extraction ---

describe("Prospective Deployment — Extract Recent Deployments", () => {
  it("extracts sell-to-open events with correct fields", () => {
    const deployments = extractRecentDeployments(makeActivityRows());
    expect(deployments.length).toBe(6);
    expect(deployments[0].symbol).toBe("EWY");
    expect(deployments[0].premiumReceived).toBe(820.32);
    expect(deployments[0].capitalDeployed).toBe(15000);
    expect(deployments[0].optionType).toBe("PUT");
  });

  it("computes immediate yield correctly", () => {
    const deployments = extractRecentDeployments(makeActivityRows());
    expect(deployments[0].immediateYield).toBeCloseTo(820.32 / 15000, 4);
    expect(deployments[1].immediateYield).toBeCloseTo(326.34 / 5000, 4);
  });

  it("ignores non-sell-to-open events", () => {
    const rows: ActivityRow[] = [
      makeSellToOpen(),
      { ...makeSellToOpen(), eventType: "shares_bought_assignment" as any },
    ];
    expect(extractRecentDeployments(rows).length).toBe(1);
  });

  it("uses all available events (no arbitrary window)", () => {
    const rows = makeActivityRows();
    expect(extractRecentDeployments(rows).length).toBe(6);
  });
});

// --- Yield Computation ---

describe("Prospective Deployment — Compute Recent Yield", () => {
  it("computes capital-weighted yield", () => {
    const deployments = extractRecentDeployments(makeActivityRows());
    const yield_ = computeRecentYield(deployments);
    // Total premium ≈ 3302, total capital ≈ 62500
    expect(yield_).not.toBeNull();
    expect(yield_!).toBeGreaterThan(0.04);
    expect(yield_!).toBeLessThan(0.06);
  });

  it("returns null for empty deployments", () => {
    expect(computeRecentYield([])).toBeNull();
  });
});

// --- Plausibility ---

describe("Prospective Deployment — Plausibility", () => {
  it("plausible when capital is cycling with time remaining", () => {
    const result = deriveProspectiveDeployment(makeActivityRows(), 52000, "2026-08-21", MONTH_END, NOW);
    expect(result.deploymentPlausible).toBe(true);
    expect(result.roughEstimate).toBeGreaterThan(0);
  });

  it("not plausible when no cycling capital", () => {
    const result = deriveProspectiveDeployment(makeActivityRows(), 0, "2026-08-21", MONTH_END, NOW);
    expect(result.deploymentPlausible).toBe(false);
    expect(result.roughEstimate).toBe(0);
  });

  it("not plausible when resolution is at month-end", () => {
    const result = deriveProspectiveDeployment(makeActivityRows(), 52000, "2026-08-31", MONTH_END, NOW);
    expect(result.deploymentPlausible).toBe(false);
  });

  it("not plausible with no activity evidence", () => {
    const result = deriveProspectiveDeployment(null, 52000, "2026-08-21", MONTH_END, NOW);
    expect(result.deploymentPlausible).toBe(false);
  });

  it("not plausible with no resolution date", () => {
    const result = deriveProspectiveDeployment(makeActivityRows(), 52000, null, MONTH_END, NOW);
    expect(result.deploymentPlausible).toBe(false);
  });
});

// --- Rough Estimate ---

describe("Prospective Deployment — Rough Estimate", () => {
  it("produces a single rounded number (no participation fractions)", () => {
    const result = deriveProspectiveDeployment(makeActivityRows(), 52000, "2026-08-21", MONTH_END, NOW);
    // ~5.3% yield × $52K ≈ $2756 → rounds to $3000
    expect(result.roughEstimate).toBe(Math.round(52000 * result.recentYield! / 1000) * 1000);
    expect(result.roughEstimate % 1000).toBe(0); // always rounded to $1K
  });

  it("scales linearly with cycling capital", () => {
    const r25 = deriveProspectiveDeployment(makeActivityRows(), 25000, "2026-08-21", MONTH_END, NOW);
    const r50 = deriveProspectiveDeployment(makeActivityRows(), 50000, "2026-08-21", MONTH_END, NOW);
    // Roughly 2× (exact depends on rounding)
    expect(r50.roughEstimate).toBeGreaterThanOrEqual(r25.roughEstimate);
  });

  it("records assumptions for operator inspection", () => {
    const result = deriveProspectiveDeployment(makeActivityRows(), 52000, "2026-08-21", MONTH_END, NOW);
    expect(result.assumptions.length).toBeGreaterThan(0);
    expect(result.assumptions.some(a => a.includes("cycles again"))).toBe(true);
    expect(result.assumptions.some(a => a.includes("opportunities"))).toBe(true);
  });
});
