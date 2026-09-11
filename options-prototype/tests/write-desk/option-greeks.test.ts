/**
 * Tests for the shared, consumer-agnostic option-greek domain.
 * These validate the availability semantics that BOTH the Operator Console and
 * the future Deployment tables rely on:
 *   - field-level evaluation (one field never affects another),
 *   - absence (null / missing) is unavailable,
 *   - 0.0 is unavailable (provider placeholder / degenerate model output),
 *   - non-finite is unavailable,
 *   - delta additionally must be within its [-1, 1] mathematical domain.
 */

import { describe, it, expect } from "vitest";
import {
  sanitizeGreeks,
  isDeltaInDomain,
  formatGreek,
  absDeltaMagnitude,
  hasAnyGreek,
  type RawContractGreeks,
} from "../../src/write-desk/option-greeks";

describe("option-greeks — sanitizeGreeks", () => {
  it("preserves all five when all are finite nonzero", () => {
    const g = sanitizeGreeks({ delta: -0.3, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 });
    expect(g).toEqual({ delta: -0.3, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 });
  });

  it("treats undefined and null fields as unavailable", () => {
    const g = sanitizeGreeks({ delta: -0.3, gamma: undefined, theta: null, vega: 0.05 });
    expect(g.delta).toBe(-0.3);
    expect(g.gamma).toBeNull();
    expect(g.theta).toBeNull();
    expect(g.vega).toBe(0.05);
    expect(g.rho).toBeNull();
  });

  it("treats 0.0 as unavailable, per field (provider placeholder)", () => {
    // theta exactly 0 → unavailable; the finite nonzero fields remain.
    const g = sanitizeGreeks({ delta: -0.3, gamma: 0.04, theta: 0, vega: 0.05, rho: 0.01 });
    expect(g.theta).toBeNull();
    expect(g.gamma).toBe(0.04);
    expect(g.vega).toBe(0.05);
  });

  it("all-zero vector → all unavailable (subsumed by per-field zero rule)", () => {
    const g = sanitizeGreeks({ delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });
    expect(g).toEqual({ delta: null, gamma: null, theta: null, vega: null, rho: null });
  });

  it("partial vector: zeros unavailable, finite nonzero preserved", () => {
    // URA-like: tiny nonzero delta/gamma, zero theta/vega/rho.
    const g = sanitizeGreeks({ delta: 0.0001, gamma: 0.00083, theta: 0, vega: 0, rho: 0 });
    expect(g.delta).toBe(0.0001);
    expect(g.gamma).toBe(0.00083);
    expect(g.theta).toBeNull();
    expect(g.vega).toBeNull();
    expect(g.rho).toBeNull();
  });

  it("BNO-like: delta pinned near 1, secondaries zero → only delta usable", () => {
    const g = sanitizeGreeks({ delta: 0.85, gamma: 0, theta: 0, vega: 0, rho: 0 });
    expect(g.delta).toBe(0.85);
    expect(g.gamma).toBeNull();
    expect(g.theta).toBeNull();
    expect(g.vega).toBeNull();
    expect(g.rho).toBeNull();
  });

  it("an invalid delta does NOT invalidate the secondary greeks", () => {
    const g = sanitizeGreeks({ delta: 2.0, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 });
    expect(g.delta).toBeNull();
    expect(g.gamma).toBe(0.04);
    expect(g.theta).toBe(-0.02);
    expect(g.vega).toBe(0.05);
    expect(g.rho).toBe(0.01);
  });

  it("a missing delta does NOT invalidate the secondary greeks", () => {
    const g = sanitizeGreeks({ gamma: 0.04, theta: -0.02 });
    expect(g.delta).toBeNull();
    expect(g.gamma).toBe(0.04);
    expect(g.theta).toBe(-0.02);
  });

  it("rejects non-finite individual greeks (NaN/Infinity) field-by-field", () => {
    const g = sanitizeGreeks({ delta: -0.3, gamma: NaN, theta: Infinity, vega: 0.05 });
    expect(g.delta).toBe(-0.3);
    expect(g.gamma).toBeNull();
    expect(g.theta).toBeNull();
    expect(g.vega).toBe(0.05);
  });

  it("does not impose arbitrary ceilings on secondary greeks", () => {
    // A large-but-finite gamma is preserved — no fixed numeric ceiling is applied.
    const g = sanitizeGreeks({ delta: -0.3, gamma: 1.3, theta: -3, vega: 2, rho: 1 });
    expect(g.gamma).toBe(1.3);
    expect(g.theta).toBe(-3);
    expect(g.vega).toBe(2);
    expect(g.rho).toBe(1);
  });
});

describe("option-greeks — isDeltaInDomain", () => {
  it("accepts [-1, 1]", () => {
    expect(isDeltaInDomain(-1)).toBe(true);
    expect(isDeltaInDomain(0)).toBe(true);
    expect(isDeltaInDomain(1)).toBe(true);
    expect(isDeltaInDomain(-0.3)).toBe(true);
  });
  it("rejects outside [-1, 1]", () => {
    expect(isDeltaInDomain(1.0001)).toBe(false);
    expect(isDeltaInDomain(-2)).toBe(false);
    expect(isDeltaInDomain(9)).toBe(false);
  });
});

describe("option-greeks — formatting & helpers", () => {
  it("formatGreek renders em dash for null and fixed decimals otherwise", () => {
    expect(formatGreek(null)).toBe("—");
    expect(formatGreek(-0.0187)).toBe("-0.0187");
    expect(formatGreek(0.04, 2)).toBe("0.04");
  });
  it("formatGreek uses adaptive precision so a tiny real value never shows as 0", () => {
    // A real value that would round to 0 at the given precision → threshold form,
    // never a false "0.0000"/"0.00".
    expect(formatGreek(0.00004, 4)).toBe("<0.0001");
    expect(formatGreek(-0.00004, 4)).toBe(">-0.0001");
    expect(formatGreek(0.0001, 2)).toBe("<0.01");   // URA-style tiny delta at 2 dp
    // A genuine exact zero is unavailable per the product rule (defensive).
    expect(formatGreek(0)).toBe("—");
  });
  it("absDeltaMagnitude returns magnitude or null", () => {
    expect(absDeltaMagnitude(-0.3)).toBe(0.3);
    expect(absDeltaMagnitude(0.35)).toBe(0.35);
    expect(absDeltaMagnitude(null)).toBeNull();
  });
  it("hasAnyGreek reflects availability", () => {
    expect(hasAnyGreek({ delta: null, gamma: null, theta: null, vega: null, rho: null })).toBe(false);
    expect(hasAnyGreek({ delta: null, gamma: 0.04, theta: null, vega: null, rho: null })).toBe(true);
  });
});

describe("option-greeks — provider examples (regression)", () => {
  it("WEAT 27C liquid contract keeps all greeks", () => {
    const raw: RawContractGreeks = { delta: 0.4503, gamma: 0.3065, theta: -0.0355, vega: 0.0156, rho: 0.0025 };
    expect(sanitizeGreeks(raw)).toEqual(raw);
  });
  it("GDXJ 129C useful secondaries preserved", () => {
    const raw: RawContractGreeks = { delta: 0.1061, gamma: 0.07286, theta: -0.113, vega: 0.004, rho: 0 };
    const g = sanitizeGreeks(raw);
    expect(g.delta).toBe(0.1061);
    expect(g.gamma).toBe(0.07286);
    expect(g.theta).toBe(-0.113);
    expect(g.vega).toBe(0.004);
    expect(g.rho).toBeNull(); // rho 0 → unavailable
  });
  it("COPX/UNG-style all-zero vector is fully unavailable", () => {
    const g = sanitizeGreeks({ delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });
    expect(hasAnyGreek(g)).toBe(false);
  });
});
