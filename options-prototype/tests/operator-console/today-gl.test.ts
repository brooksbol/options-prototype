import { describe, it, expect } from "vitest";
import {
  computeTodayGlPerShare,
  computeTodayGlDollar,
  computeTodayGlPercent,
  formatTodayGl,
  formatTodayGlPercent,
  formatTodayGlCombined,
  todayGlDirection,
} from "../../src/operator-console/today-gl";

// BUG-020: "Today's G/L" must be measured against the PRIOR SESSION CLOSE
// (broker parity), NOT against Wheelwright's first intraday observation. These
// tests encode the prior-close semantic and use fixtures near the real Fidelity
// Sep-16-2026 rows that exposed the defect (sign reversal, large gap, fractional).

describe("computeTodayGlPerShare (prior-close baseline)", () => {
  it("returns null when last or previousClose is missing", () => {
    expect(computeTodayGlPerShare({ last: null, previousClose: 84.59 })).toBeNull();
    expect(computeTodayGlPerShare({ last: 85.93, previousClose: null })).toBeNull();
    expect(computeTodayGlPerShare({ last: null, previousClose: null })).toBeNull();
    expect(computeTodayGlPerShare({ last: undefined, previousClose: undefined })).toBeNull();
  });

  it("computes a positive per-share move (COPX: up vs prior close)", () => {
    // Fidelity: last 85.93, prior close 84.59 → +1.34/share
    expect(computeTodayGlPerShare({ last: 85.93, previousClose: 84.59 })).toBeCloseTo(1.34, 6);
  });

  it("computes a negative per-share move", () => {
    // DBO: last 25.35, prior close 26.35 → -1.00/share
    expect(computeTodayGlPerShare({ last: 25.35, previousClose: 26.35 })).toBeCloseTo(-1.0, 6);
  });
});

describe("computeTodayGlDollar (position-level, quantity-scaled)", () => {
  it("SIGN-REVERSAL GUARD (COPX): positive Fidelity daily G/L must render positive", () => {
    // The old first-observation baseline produced ≈ −$12 here; prior close gives +$134.
    const gl = computeTodayGlDollar({ last: 85.93, previousClose: 84.59 }, 100);
    expect(gl).not.toBeNull();
    expect(gl!).toBeGreaterThan(0);
    expect(gl!).toBeCloseTo(134, 0); // (85.93 − 84.59) × 100 = 134
  });

  it("GDXJ ≈ +$113", () => {
    expect(computeTodayGlDollar({ last: 121.44, previousClose: 120.31 }, 100)).toBeCloseTo(113, 0);
  });

  it("LARGE-GAP GUARD (SMH): whole opening gap included → ≈ +$891, not −$98", () => {
    const gl = computeTodayGlDollar({ last: 551.02, previousClose: 542.11 }, 100);
    expect(gl!).toBeGreaterThan(0);
    expect(gl!).toBeCloseTo(891, 0); // (551.02 − 542.11) × 100 = 891
  });

  it("FRACTIONAL-QUANTITY GUARD (SPYI): 69.829 shares handled correctly ≈ +$13.18", () => {
    // Fidelity: last 52.855, prior close 52.666, qty 69.829 → +0.189 × 69.829 ≈ 13.19
    const gl = computeTodayGlDollar({ last: 52.855, previousClose: 52.666 }, 69.829);
    expect(gl!).toBeCloseTo(13.19, 1);
  });

  it("URA ≈ +$10", () => {
    expect(computeTodayGlDollar({ last: 41.87, previousClose: 41.77 }, 100)).toBeCloseTo(10, 0);
  });

  it("returns null (no fabricated 0) when previousClose is unavailable", () => {
    expect(computeTodayGlDollar({ last: 85.93, previousClose: null }, 100)).toBeNull();
  });
});

describe("computeTodayGlPercent (prior-close baseline)", () => {
  it("returns null for missing inputs or non-positive prior close", () => {
    expect(computeTodayGlPercent({ last: 85.93, previousClose: null })).toBeNull();
    expect(computeTodayGlPercent({ last: null, previousClose: 84.59 })).toBeNull();
    expect(computeTodayGlPercent({ last: 85.93, previousClose: 0 })).toBeNull();
    expect(computeTodayGlPercent({ last: 85.93, previousClose: -1 })).toBeNull();
  });

  it("COPX percent ≈ +1.58%", () => {
    // (85.93 − 84.59) / 84.59 × 100 ≈ 1.584
    expect(computeTodayGlPercent({ last: 85.93, previousClose: 84.59 })).toBeCloseTo(1.58, 2);
  });

  it("negative percent for a down day", () => {
    // (25.35 − 26.35) / 26.35 × 100 ≈ -3.795
    expect(computeTodayGlPercent({ last: 25.35, previousClose: 26.35 })).toBeCloseTo(-3.795, 2);
  });
});

describe("$ and % consistency", () => {
  it("share the same null condition (both null when previousClose missing)", () => {
    const inputs = { last: 100, previousClose: null };
    expect(computeTodayGlPerShare(inputs)).toBeNull();
    expect(computeTodayGlPercent(inputs)).toBeNull();
  });

  it("share the same sign for the same inputs", () => {
    const up = { last: 105, previousClose: 100 };
    expect(computeTodayGlPerShare(up)!).toBeGreaterThan(0);
    expect(computeTodayGlPercent(up)!).toBeGreaterThan(0);

    const down = { last: 95, previousClose: 100 };
    expect(computeTodayGlPerShare(down)!).toBeLessThan(0);
    expect(computeTodayGlPercent(down)!).toBeLessThan(0);
  });
});

describe("formatTodayGl", () => {
  it("formats dollars with sign", () => {
    expect(formatTodayGl(2.5)).toBe("+$2.50");
    expect(formatTodayGl(-1.25)).toBe("-$1.25");
    expect(formatTodayGl(0)).toBe("$0.00");
    expect(formatTodayGl(null)).toBe("—");
  });
});

describe("formatTodayGlPercent", () => {
  it("formats percent with sign", () => {
    expect(formatTodayGlPercent(1.24)).toBe("+1.24%");
    expect(formatTodayGlPercent(-0.83)).toBe("-0.83%");
    expect(formatTodayGlPercent(0)).toBe("0.00%");
    expect(formatTodayGlPercent(null)).toBe("—");
  });
});

describe("formatTodayGlCombined", () => {
  it("combines dollars and percent", () => {
    expect(formatTodayGlCombined(0.42, 1.24)).toBe("+$0.42 (+1.24%)");
    expect(formatTodayGlCombined(-1.07, -0.83)).toBe("-$1.07 (-0.83%)");
  });
  it("returns — when the dollar change is null (unavailable prior close)", () => {
    expect(formatTodayGlCombined(null, null)).toBe("—");
    expect(formatTodayGlCombined(null, 1.2)).toBe("—");
  });
  it("shows dollars only when percent is unavailable", () => {
    expect(formatTodayGlCombined(0.5, null)).toBe("+$0.50");
  });
});

describe("todayGlDirection", () => {
  it("maps sign to up/down/flat", () => {
    expect(todayGlDirection(1)).toBe("up");
    expect(todayGlDirection(-1)).toBe("down");
    expect(todayGlDirection(0)).toBe("flat");
    expect(todayGlDirection(null)).toBe("flat");
  });
});
