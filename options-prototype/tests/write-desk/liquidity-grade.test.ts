/**
 * Liquidity Grade Tests — Proves:
 *
 * 1. Tier cutoffs (inclusive) for L1–L4
 * 2. Weakest link: the worse of spread and OI decides; neither compensates
 * 3. limitedBy names the measure(s) that set the tier
 * 4. Unobserved/invalid inputs are ungraded, never guessed
 * 5. Sort ordering: tier → tighter spread → larger OI; ungraded last; ties share a key
 * 6. Cross-entry rows carry spread/OI/volume and the grade from source candidates
 * 7. Grade is display-only: posture, Prod v0 and default order are unchanged
 */
import { describe, it, expect } from "vitest";
import {
  gradeLiquidity,
  compareLiquidity,
  withLiquiditySortKeys,
  describeLiquidity,
  LIQUIDITY_GRADE_POLICY,
} from "../../src/write-desk/liquidity-grade";
import { buildCrossEntryRows } from "../../src/write-desk/production-v0";
import type { PutCandidate } from "../../src/write-desk/candidate-types";
import type { BuyWriteCandidate } from "../../src/write-desk/recommend-buy-writes";
import { computeBuyWriteEconomics } from "../../src/write-desk/recommend-buy-writes";

describe("gradeLiquidity — tiers", () => {
  it("grades the four tiers at their inclusive cutoffs", () => {
    expect(gradeLiquidity({ spreadPercent: 5, openInterest: 1000 })?.label).toBe("L1");
    expect(gradeLiquidity({ spreadPercent: 10, openInterest: 250 })?.label).toBe("L2");
    expect(gradeLiquidity({ spreadPercent: 20, openInterest: 50 })?.label).toBe("L3");
    expect(gradeLiquidity({ spreadPercent: 20.01, openInterest: 50 })?.label).toBe("L4");
    expect(gradeLiquidity({ spreadPercent: 20, openInterest: 49 })?.label).toBe("L4");
  });

  it("uses the approved provisional cutoffs", () => {
    expect(LIQUIDITY_GRADE_POLICY.version).toBe("v0-provisional");
    expect(LIQUIDITY_GRADE_POLICY.tiers.map((t) => [t.maxSpreadPercent, t.minOpenInterest])).toEqual([
      [5, 1000], [10, 250], [20, 50],
    ]);
  });
});

describe("gradeLiquidity — weakest link", () => {
  it("deep open interest does not rescue a wide spread", () => {
    const g = gradeLiquidity({ spreadPercent: 60, openInterest: 20000 });
    expect(g?.tier).toBe(4);
    expect(g?.limitedBy).toBe("spread");
    expect(g?.openInterestTier).toBe(1);
  });

  it("a tight spread does not rescue thin open interest", () => {
    const g = gradeLiquidity({ spreadPercent: 2, openInterest: 120 });
    expect(g?.tier).toBe(3);
    expect(g?.limitedBy).toBe("openInterest");
  });

  it("reports both when both measures set the tier", () => {
    expect(gradeLiquidity({ spreadPercent: 8, openInterest: 300 })?.limitedBy).toBe("both");
  });

  it("L1 has no limiting measure", () => {
    expect(gradeLiquidity({ spreadPercent: 3.8, openInterest: 5000 })?.limitedBy).toBeNull();
  });
});

describe("gradeLiquidity — unobserved inputs", () => {
  it.each([
    [{ spreadPercent: NaN, openInterest: 500 }],
    [{ spreadPercent: 5, openInterest: Number.POSITIVE_INFINITY }],
    [{ spreadPercent: -1, openInterest: 500 }],
    [{ spreadPercent: 5, openInterest: -1 }],
    [{ spreadPercent: null, openInterest: 500 }],
    [{ spreadPercent: 5, openInterest: undefined }],
  ])("returns null for %j", (input) => {
    expect(gradeLiquidity(input)).toBeNull();
  });

  it("describes an ungraded row plainly", () => {
    expect(describeLiquidity(null, { spreadPercent: 0, openInterest: 0 })).toMatch(/Not graded/);
  });
});

describe("liquidity ordering", () => {
  const row = (spreadPercent: number, openInterest: number, id: string) => ({
    id, spreadPercent, openInterest, liquidity: gradeLiquidity({ spreadPercent, openInterest }),
  });

  it("orders by tier, then tighter spread, then larger OI", () => {
    const rows = [
      row(4, 1500, "L1-wider"),
      row(67, 5000, "L4"),
      row(3, 1200, "L1-tight-low-oi"),
      row(3, 9000, "L1-tight-high-oi"),
      row(8, 400, "L2"),
    ];
    const ordered = [...rows].sort(compareLiquidity).map((r) => r.id);
    expect(ordered).toEqual(["L1-tight-high-oi", "L1-tight-low-oi", "L1-wider", "L2", "L4"]);
  });

  it("sort keys are higher for more liquid rows, shared on ties, undefined when ungraded", () => {
    const rows = [
      row(8, 400, "L2"),
      row(3, 9000, "L1a"),
      row(3, 9000, "L1b"),
      { id: "ungraded", spreadPercent: NaN, openInterest: 100, liquidity: null },
      row(67, 5000, "L4"),
    ];
    const keyed = withLiquiditySortKeys(rows);
    const key = (id: string) => keyed.find((r) => r.id === id)!.liquiditySortKey;
    expect(key("L1a")).toBe(key("L1b"));
    expect(key("L1a")!).toBeGreaterThan(key("L2")!);
    expect(key("L2")!).toBeGreaterThan(key("L4")!);
    expect(key("ungraded")).toBeUndefined();
    // Original row order and content are preserved.
    expect(keyed.map((r) => r.id)).toEqual(rows.map((r) => r.id));
  });
});

// --- Cross-entry integration ---

function makePut(overrides: Partial<PutCandidate> = {}): PutCandidate {
  return {
    rank: 1, symbol: "KSA", expiration: "2026-11-20", dte: 24, strike: 32, delta: -0.29,
    bid: 0.25, ask: 0.5, mid: 0.375, spreadPercent: 66.7, openInterest: 800, volume: 12,
    cashRequired: 3200, cashRemaining: 400, yieldAnnualized: 17.8,
    assessment: { score: 47, posture: "EDGE", components: [], hardNoReason: null, policyVersion: "v1" },
    posture: "EDGE", affordable: true, governance: { status: "authorized", reason: "" },
    ...overrides,
  };
}

function makeBuyWrite(overrides: Partial<BuyWriteCandidate> = {}): BuyWriteCandidate {
  const economics = computeBuyWriteEconomics(23.025, 23.5, 0.265, 10);
  return {
    rank: 1, symbol: "KWEB", expiration: "2026-11-06", dte: 10, strike: 23.5, delta: 0.35,
    bid: 0.26, ask: 0.27, mid: 0.265, spreadPercent: 3.8, openInterest: 4200, volume: 310,
    underlyingPrice: 23.025, capitalRequired: 2302.5, cashRemaining: 1303.96,
    premiumYieldAnnualized: economics.premiumYieldAnnualized,
    totalReturnIfAssignedAnnualized: economics.totalReturnIfAssignedAnnualized,
    totalReturnIfCalledPercent: economics.totalReturnIfCalledPercent,
    strikeAbovePrice: true, appreciationPerShare: 0.475, economics,
    assessment: { score: 100, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1" },
    posture: "ACTIONABLE", affordable: true, governance: { status: "authorized", reason: "" },
    ...overrides,
  };
}

describe("buildCrossEntryRows — liquidity fields", () => {
  it("copies spread, OI and volume and grades both mechanisms", () => {
    const rows = buildCrossEntryRows([makePut()], [makeBuyWrite()]);
    const csp = rows.find((r) => r.entryMechanism === "csp")!;
    const bw = rows.find((r) => r.entryMechanism === "buy-write")!;

    expect([csp.spreadPercent, csp.openInterest, csp.volume]).toEqual([66.7, 800, 12]);
    expect(csp.liquidity?.label).toBe("L4");
    expect(csp.liquidity?.limitedBy).toBe("spread");

    expect([bw.spreadPercent, bw.openInterest, bw.volume]).toEqual([3.8, 4200, 310]);
    expect(bw.liquidity?.label).toBe("L1");
  });

  it("is display-only: posture, Prod v0 and default order do not depend on the grade", () => {
    const put = makePut();
    const bw = makeBuyWrite();
    const base = buildCrossEntryRows([put], [bw]);
    // Swap liquidity facts between the two candidates; nothing else changes.
    const swapped = buildCrossEntryRows(
      [makePut({ spreadPercent: 3.8, openInterest: 4200 })],
      [makeBuyWrite({ spreadPercent: 66.7, openInterest: 800 })],
    );
    expect(swapped.map((r) => [r.entryMechanism, r.posture, r.productionV0])).toEqual(
      base.map((r) => [r.entryMechanism, r.posture, r.productionV0]),
    );
    expect(swapped.map((r) => r.liquidity?.label)).not.toEqual(base.map((r) => r.liquidity?.label));
  });
});
