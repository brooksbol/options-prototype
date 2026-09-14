import { describe, it, expect } from "vitest";
import {
  computeTodayUnderlyingChange,
  formatTodayGl,
  todayGlDirection,
} from "../../src/operator-console/today-gl";
import type { SpotObservation } from "../../src/evidence/use-spot-history";

function obs(price: number, iso: string): SpotObservation {
  return { price, observedAt: iso };
}

describe("computeTodayUnderlyingChange", () => {
  it("returns null for empty or single-observation series", () => {
    expect(computeTodayUnderlyingChange(null)).toBeNull();
    expect(computeTodayUnderlyingChange(undefined)).toBeNull();
    expect(computeTodayUnderlyingChange([])).toBeNull();
    expect(computeTodayUnderlyingChange([obs(10, "2026-09-14T14:00:00Z")])).toBeNull();
  });

  it("computes latest minus first-of-latest-day (positive)", () => {
    const series = [
      obs(100, "2026-09-14T13:30:00Z"),
      obs(101, "2026-09-14T15:00:00Z"),
      obs(102.5, "2026-09-14T19:59:00Z"),
    ];
    // 102.5 - 100 = 2.5
    expect(computeTodayUnderlyingChange(series)).toBeCloseTo(2.5, 6);
  });

  it("computes a negative move", () => {
    const series = [
      obs(50, "2026-09-14T13:30:00Z"),
      obs(48.75, "2026-09-14T19:59:00Z"),
    ];
    expect(computeTodayUnderlyingChange(series)).toBeCloseTo(-1.25, 6);
  });

  it("isolates the LATEST day only — prior-day points do not fold in", () => {
    const series = [
      obs(90, "2026-09-11T19:00:00Z"), // prior day — must be ignored
      obs(100, "2026-09-14T13:30:00Z"), // today's open
      obs(103, "2026-09-14T19:59:00Z"), // today's latest
    ];
    // Should be 103 - 100 = 3 (NOT 103 - 90 = 13). Guards against BUG-015-style folding.
    expect(computeTodayUnderlyingChange(series)).toBeCloseTo(3, 6);
  });

  it("returns null when the latest day has only one moment (no intraday reference)", () => {
    const series = [
      obs(90, "2026-09-11T19:00:00Z"),
      obs(100, "2026-09-14T13:30:00Z"), // only one same-day moment
    ];
    expect(computeTodayUnderlyingChange(series)).toBeNull();
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

describe("todayGlDirection", () => {
  it("maps sign to up/down/flat", () => {
    expect(todayGlDirection(1)).toBe("up");
    expect(todayGlDirection(-1)).toBe("down");
    expect(todayGlDirection(0)).toBe("flat");
    expect(todayGlDirection(null)).toBe("flat");
  });
});
