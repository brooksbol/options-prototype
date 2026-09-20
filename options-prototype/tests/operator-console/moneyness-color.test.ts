/**
 * Moneyness Graded Color — BUG-024 Regression
 *
 * Proves the graded moneyness operator grammar and, specifically, that CALL moneyness
 * is no longer suppressed to neutral but participates as the contract-side mirror of the
 * PUT/CSP heuristic:
 *
 *   - intensity grades with distance from ATM (deep OTM/ITM strong; near-ATM faint → amber)
 *   - polarity by side/type: PUT → OTM green / ITM red; CALL & BW → OTM red / ITM green
 *   - ATM is the shared amber center for every position type
 *
 * These are pure-function tests; no live market or Evidence backend required.
 */

import { describe, it, expect } from "vitest";
import { moneynessGradedColor } from "../../src/operator-console/moneyness-color";

// --- rgba parsing helper -----------------------------------------------------

type Rgba = { r: number; g: number; b: number; a: number };

function parseRgba(css: string | undefined): Rgba {
  if (!css) throw new Error(`expected an rgba() string, got ${css}`);
  const m = css.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!m) throw new Error(`not an rgba() string: ${css}`);
  return { r: +m[1], g: +m[2], b: +m[3], a: +m[4] };
}

// Canonical hues used by the graded grammar.
const GREEN = { r: 22, g: 163, b: 74 };
const RED_HUE = { r: 220, g: 38, b: 38 };
const AMBER = { r: 202, g: 138, b: 4 };

function hueOf(css: string | undefined): "green" | "red" | "amber" | "other" {
  const { r, g, b } = parseRgba(css);
  if (r === GREEN.r && g === GREEN.g && b === GREEN.b) return "green";
  if (r === RED_HUE.r && g === RED_HUE.g && b === RED_HUE.b) return "red";
  if (r === AMBER.r && g === AMBER.g && b === AMBER.b) return "amber";
  return "other";
}

// --- ATM shared amber center -------------------------------------------------

describe("moneynessGradedColor — ATM is the shared amber center", () => {
  for (const type of ["put", "call", "buy-write"] as const) {
    it(`renders amber at exact ATM for ${type}`, () => {
      expect(hueOf(moneynessGradedColor(type, 0))).toBe("amber");
    });
    it(`renders amber just inside the ATM band for ${type} (±0.008)`, () => {
      expect(hueOf(moneynessGradedColor(type, 0.008))).toBe("amber");
      expect(hueOf(moneynessGradedColor(type, -0.008))).toBe("amber");
    });
  }
});

// --- PUT / CSP polarity (preserved) -----------------------------------------

describe("moneynessGradedColor — PUT polarity (OTM green / ITM red)", () => {
  it("OTM put is green", () => {
    expect(hueOf(moneynessGradedColor("put", -0.08))).toBe("green");
  });
  it("ITM put is red", () => {
    expect(hueOf(moneynessGradedColor("put", 0.08))).toBe("red");
  });
});

// --- CALL polarity (BUG-024 fix: mirror of PUT, not neutral) ------------------

describe("moneynessGradedColor — CALL polarity is the mirror of PUT (BUG-024)", () => {
  it("OTM call is red (mirror of PUT's OTM green)", () => {
    expect(hueOf(moneynessGradedColor("call", -0.08))).toBe("red");
  });
  it("ITM call is green (mirror of PUT's ITM red)", () => {
    expect(hueOf(moneynessGradedColor("call", 0.08))).toBe("green");
  });
  it("CALL is never neutral/undefined when an observation exists", () => {
    expect(moneynessGradedColor("call", -0.08)).toBeDefined();
    expect(moneynessGradedColor("call", 0.08)).toBeDefined();
    expect(moneynessGradedColor("call", 0)).toBeDefined();
  });
  it("CALL and PUT are opposite hues on the same side of the strike", () => {
    expect(hueOf(moneynessGradedColor("call", -0.08))).not.toBe(
      hueOf(moneynessGradedColor("put", -0.08)),
    );
    expect(hueOf(moneynessGradedColor("call", 0.08))).not.toBe(
      hueOf(moneynessGradedColor("put", 0.08)),
    );
  });
});

// --- BW shares CALL-side polarity -------------------------------------------

describe("moneynessGradedColor — BUY-WRITE uses call-side polarity", () => {
  it("OTM buy-write is red", () => {
    expect(hueOf(moneynessGradedColor("buy-write", -0.08))).toBe("red");
  });
  it("ITM buy-write is green", () => {
    expect(hueOf(moneynessGradedColor("buy-write", 0.08))).toBe("green");
  });
});

// --- Grading: intensity increases with distance from ATM ---------------------

describe("moneynessGradedColor — intensity grades with distance from ATM", () => {
  it("deep OTM put is DARKER (higher alpha) than a barely-OTM put — the sanity check", () => {
    const deep = parseRgba(moneynessGradedColor("put", -0.14));   // deep OTM
    const shallow = parseRgba(moneynessGradedColor("put", -0.02)); // barely OTM
    // Both green (PUT OTM), but deep must be visibly stronger.
    expect(hueOf(moneynessGradedColor("put", -0.14))).toBe("green");
    expect(hueOf(moneynessGradedColor("put", -0.02))).toBe("green");
    expect(deep.a).toBeGreaterThan(shallow.a);
  });

  it("deep OTM put saturates at the strong end (alpha ≈ 0.75)", () => {
    const deep = parseRgba(moneynessGradedColor("put", -0.20));
    expect(deep.a).toBeCloseTo(0.75, 2);
  });

  it("barely-OTM (just outside ATM band) sits near the ramp floor (~0.22)", () => {
    const shallow = parseRgba(moneynessGradedColor("put", -0.011));
    expect(shallow.a).toBeGreaterThanOrEqual(0.22);
    expect(shallow.a).toBeLessThan(0.30);
  });

  it("intensity is monotonic non-decreasing with distance for calls too", () => {
    const a1 = parseRgba(moneynessGradedColor("call", 0.03)).a;
    const a2 = parseRgba(moneynessGradedColor("call", 0.08)).a;
    const a3 = parseRgba(moneynessGradedColor("call", 0.15)).a;
    expect(a2).toBeGreaterThanOrEqual(a1);
    expect(a3).toBeGreaterThanOrEqual(a2);
  });
});

// --- No observation ----------------------------------------------------------

describe("moneynessGradedColor — no observation", () => {
  it("returns undefined for null moneyness (caller renders no background)", () => {
    expect(moneynessGradedColor("put", null)).toBeUndefined();
    expect(moneynessGradedColor("call", null)).toBeUndefined();
    expect(moneynessGradedColor("buy-write", null)).toBeUndefined();
  });
});
