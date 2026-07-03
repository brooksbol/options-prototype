import { describe, it, expect } from "vitest";
import {
  DEFAULT_DELTA_POLICY,
  resolveTieBreaker,
} from "../../src/domain/policy";
import type { OptionContract } from "../../src/domain/types";

function makeContract(
  type: "CALL" | "PUT",
  strike: number,
  delta: number
): OptionContract {
  return {
    type,
    strike,
    bid: 1.0,
    ask: 1.2,
    delta,
    openInterest: 1000,
    volume: 500,
  };
}

describe("DEFAULT_DELTA_POLICY", () => {
  it("has targetDelta of 0.30", () => {
    expect(DEFAULT_DELTA_POLICY.targetDelta).toBe(0.3);
  });

  it("has tieBreaker of PreferOTM", () => {
    expect(DEFAULT_DELTA_POLICY.tieBreaker).toBe("PreferOTM");
  });
});

describe("resolveTieBreaker", () => {
  describe("PreferOTM", () => {
    it("prefers higher strike for CALL (more OTM)", () => {
      const a = makeContract("CALL", 540, 0.35);
      const b = makeContract("CALL", 550, 0.25);
      expect(resolveTieBreaker(a, b, "PreferOTM")).toBe(b);
    });

    it("prefers lower strike for PUT (more OTM)", () => {
      const a = makeContract("PUT", 540, -0.25);
      const b = makeContract("PUT", 550, -0.35);
      expect(resolveTieBreaker(a, b, "PreferOTM")).toBe(a);
    });

    it("returns first when strikes are equal (CALL)", () => {
      const a = makeContract("CALL", 545, 0.30);
      const b = makeContract("CALL", 545, 0.30);
      expect(resolveTieBreaker(a, b, "PreferOTM")).toBe(a);
    });

    it("returns first when strikes are equal (PUT)", () => {
      const a = makeContract("PUT", 545, -0.30);
      const b = makeContract("PUT", 545, -0.30);
      expect(resolveTieBreaker(a, b, "PreferOTM")).toBe(a);
    });
  });

  describe("PreferITM", () => {
    it("prefers lower strike for CALL (more ITM)", () => {
      const a = makeContract("CALL", 540, 0.35);
      const b = makeContract("CALL", 550, 0.25);
      expect(resolveTieBreaker(a, b, "PreferITM")).toBe(a);
    });

    it("prefers higher strike for PUT (more ITM)", () => {
      const a = makeContract("PUT", 540, -0.25);
      const b = makeContract("PUT", 550, -0.35);
      expect(resolveTieBreaker(a, b, "PreferITM")).toBe(b);
    });
  });

  describe("PreferHigherStrike", () => {
    it("prefers higher strike regardless of type", () => {
      const a = makeContract("CALL", 540, 0.35);
      const b = makeContract("CALL", 550, 0.25);
      expect(resolveTieBreaker(a, b, "PreferHigherStrike")).toBe(b);
    });

    it("works for puts", () => {
      const a = makeContract("PUT", 540, -0.25);
      const b = makeContract("PUT", 550, -0.35);
      expect(resolveTieBreaker(a, b, "PreferHigherStrike")).toBe(b);
    });
  });

  describe("PreferLowerStrike", () => {
    it("prefers lower strike regardless of type", () => {
      const a = makeContract("CALL", 540, 0.35);
      const b = makeContract("CALL", 550, 0.25);
      expect(resolveTieBreaker(a, b, "PreferLowerStrike")).toBe(a);
    });

    it("works for puts", () => {
      const a = makeContract("PUT", 540, -0.25);
      const b = makeContract("PUT", 550, -0.35);
      expect(resolveTieBreaker(a, b, "PreferLowerStrike")).toBe(a);
    });
  });
});
