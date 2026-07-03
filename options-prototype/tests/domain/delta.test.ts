import { describe, it, expect } from "vitest";
import { findClosestToDelta } from "../../src/domain/delta";
import type { OptionContract } from "../../src/domain/types";

function makeCall(strike: number, delta: number): OptionContract {
  return {
    type: "CALL",
    strike,
    bid: 1.0,
    ask: 1.2,
    delta,
    openInterest: 1000,
    volume: 500,
  };
}

function makePut(strike: number, delta: number): OptionContract {
  return {
    type: "PUT",
    strike,
    bid: 1.0,
    ask: 1.2,
    delta,
    openInterest: 1000,
    volume: 500,
  };
}

describe("findClosestToDelta (BR-6)", () => {
  describe("basic matching", () => {
    it("returns null for empty array", () => {
      expect(findClosestToDelta([], 0.3, "PreferOTM")).toBeNull();
    });

    it("returns the only contract when array has one element", () => {
      const contract = makeCall(545, 0.45);
      expect(findClosestToDelta([contract], 0.3, "PreferOTM")).toBe(contract);
    });

    it("finds exact delta match", () => {
      const contracts = [
        makeCall(540, 0.50),
        makeCall(545, 0.30),
        makeCall(550, 0.15),
      ];
      expect(findClosestToDelta(contracts, 0.3, "PreferOTM")).toBe(
        contracts[1]
      );
    });

    it("finds closest when no exact match (closer from below)", () => {
      const contracts = [
        makeCall(540, 0.50),
        makeCall(545, 0.28),
        makeCall(550, 0.15),
      ];
      // |0.28 - 0.30| = 0.02, |0.50 - 0.30| = 0.20, |0.15 - 0.30| = 0.15
      expect(findClosestToDelta(contracts, 0.3, "PreferOTM")).toBe(
        contracts[1]
      );
    });

    it("finds closest when no exact match (closer from above)", () => {
      const contracts = [
        makeCall(540, 0.50),
        makeCall(545, 0.32),
        makeCall(550, 0.15),
      ];
      // |0.32 - 0.30| = 0.02, |0.50 - 0.30| = 0.20, |0.15 - 0.30| = 0.15
      expect(findClosestToDelta(contracts, 0.3, "PreferOTM")).toBe(
        contracts[1]
      );
    });
  });

  describe("puts use absolute delta for comparison", () => {
    it("compares |delta| to target for puts", () => {
      const contracts = [
        makePut(550, -0.50),
        makePut(545, -0.28),
        makePut(540, -0.15),
      ];
      // ||-0.28| - 0.30| = 0.02 (closest)
      expect(findClosestToDelta(contracts, 0.3, "PreferOTM")).toBe(
        contracts[1]
      );
    });

    it("finds exact absolute match for puts", () => {
      const contracts = [
        makePut(550, -0.50),
        makePut(545, -0.30),
        makePut(540, -0.15),
      ];
      expect(findClosestToDelta(contracts, 0.3, "PreferOTM")).toBe(
        contracts[1]
      );
    });
  });

  describe("tie-breaking with PreferOTM", () => {
    it("prefers higher strike for equidistant calls", () => {
      const contracts = [
        makeCall(540, 0.35), // |0.35 - 0.30| = 0.05
        makeCall(550, 0.25), // |0.25 - 0.30| = 0.05
      ];
      const result = findClosestToDelta(contracts, 0.3, "PreferOTM");
      expect(result?.strike).toBe(550); // higher strike = more OTM for calls
    });

    it("prefers lower strike for equidistant puts", () => {
      const contracts = [
        makePut(540, -0.25), // ||-0.25| - 0.30| = 0.05
        makePut(550, -0.35), // ||-0.35| - 0.30| = 0.05
      ];
      const result = findClosestToDelta(contracts, 0.3, "PreferOTM");
      expect(result?.strike).toBe(540); // lower strike = more OTM for puts
    });
  });

  describe("tie-breaking with PreferITM", () => {
    it("prefers lower strike for equidistant calls", () => {
      const contracts = [
        makeCall(540, 0.35),
        makeCall(550, 0.25),
      ];
      const result = findClosestToDelta(contracts, 0.3, "PreferITM");
      expect(result?.strike).toBe(540); // lower strike = more ITM for calls
    });

    it("prefers higher strike for equidistant puts", () => {
      const contracts = [
        makePut(540, -0.25),
        makePut(550, -0.35),
      ];
      const result = findClosestToDelta(contracts, 0.3, "PreferITM");
      expect(result?.strike).toBe(550); // higher strike = more ITM for puts
    });
  });

  describe("tie-breaking with strike preference", () => {
    it("PreferHigherStrike selects higher strike on tie", () => {
      const contracts = [
        makeCall(540, 0.35),
        makeCall(550, 0.25),
      ];
      const result = findClosestToDelta(contracts, 0.3, "PreferHigherStrike");
      expect(result?.strike).toBe(550);
    });

    it("PreferLowerStrike selects lower strike on tie", () => {
      const contracts = [
        makeCall(540, 0.35),
        makeCall(550, 0.25),
      ];
      const result = findClosestToDelta(contracts, 0.3, "PreferLowerStrike");
      expect(result?.strike).toBe(540);
    });
  });

  describe("edge cases", () => {
    it("handles all contracts with same delta", () => {
      const contracts = [
        makeCall(540, 0.30),
        makeCall(545, 0.30),
        makeCall(550, 0.30),
      ];
      // All equidistant (distance=0), tie-breaker cascades through all
      // PreferOTM for calls = highest strike
      const result = findClosestToDelta(contracts, 0.3, "PreferOTM");
      expect(result?.strike).toBe(550);
    });

    it("handles target delta at boundary (0.01)", () => {
      const contracts = [
        makeCall(555, 0.05),
        makeCall(560, 0.02),
      ];
      // |0.05 - 0.01| = 0.04, |0.02 - 0.01| = 0.01
      expect(findClosestToDelta(contracts, 0.01, "PreferOTM")).toBe(
        contracts[1]
      );
    });

    it("handles target delta at boundary (0.99)", () => {
      const contracts = [
        makeCall(530, 0.95),
        makeCall(525, 0.98),
      ];
      // |0.95 - 0.99| = 0.04, |0.98 - 0.99| = 0.01
      expect(findClosestToDelta(contracts, 0.99, "PreferOTM")).toBe(
        contracts[1]
      );
    });
  });
});
