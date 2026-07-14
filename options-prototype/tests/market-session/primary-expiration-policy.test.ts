/**
 * Tests for PrimaryExpirationPolicy — selection algorithm.
 */

import { describe, it, expect } from "vitest";
import {
  selectPrimaryExpiration,
  DEFAULT_PRIMARY_EXPIRATION_POLICY,
  type PrimaryExpirationPolicy,
} from "../../src/market-session/primary-expiration-policy";
import type { Expiration } from "../../src/domain/types";

function makeExp(dte: number): Expiration {
  const d = new Date();
  d.setDate(d.getDate() + dte);
  return { date: d.toISOString().split("T")[0], dte };
}

describe("selectPrimaryExpiration", () => {
  const policy = DEFAULT_PRIMARY_EXPIRATION_POLICY;

  it("selects expiration nearest to target DTE (21)", () => {
    const exps = [makeExp(7), makeExp(14), makeExp(21), makeExp(28), makeExp(35)];
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.selected).not.toBeNull();
    expect(result.selected!.dte).toBe(21);
    expect(result.distanceFromTarget).toBe(0);
  });

  it("when target is not exact, selects nearest available", () => {
    const exps = [makeExp(7), makeExp(14), makeExp(28), makeExp(35)];
    const result = selectPrimaryExpiration(exps, policy);
    // 14 is distance 7, 28 is distance 7 — tie-break NEARER → 14
    expect(result.selected!.dte).toBe(14);
    expect(result.distanceFromTarget).toBe(7);
  });

  it("tie-breaker NEARER: prefers lower DTE when equidistant", () => {
    const exps = [makeExp(18), makeExp(24)]; // both distance 3 from 21
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.selected!.dte).toBe(18);
  });

  it("tie-breaker FARTHER: prefers higher DTE when equidistant", () => {
    const fartherPolicy: PrimaryExpirationPolicy = { ...policy, tieBreaker: "FARTHER" };
    const exps = [makeExp(18), makeExp(24)]; // both distance 3 from 21
    const result = selectPrimaryExpiration(exps, fartherPolicy);
    expect(result.selected!.dte).toBe(24);
  });

  it("filters to eligible range (excludes DTE < 7)", () => {
    const exps = [makeExp(3), makeExp(5), makeExp(14)];
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.selected!.dte).toBe(14);
    expect(result.eligibleCount).toBe(1); // only 14 is in range
  });

  it("filters to eligible range (excludes DTE > 45)", () => {
    const exps = [makeExp(50), makeExp(60), makeExp(30)];
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.selected!.dte).toBe(30);
    expect(result.eligibleCount).toBe(1);
  });

  it("no eligible expirations returns null with explanation", () => {
    const exps = [makeExp(3), makeExp(50)];
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.selected).toBeNull();
    expect(result.eligibleCount).toBe(0);
    expect(result.explanation).toContain("No expiration within eligible range");
  });

  it("empty expiration list returns null", () => {
    const result = selectPrimaryExpiration([], policy);
    expect(result.selected).toBeNull();
    expect(result.eligibleCount).toBe(0);
  });

  it("searches the FULL eligible range (no maxDistanceFromTarget narrowing)", () => {
    // Only expiration at DTE 42 — far from target 21 but within eligible range
    const exps = [makeExp(42)];
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.selected!.dte).toBe(42);
    expect(result.distanceFromTarget).toBe(21); // large distance but still selected
  });

  it("records policy version", () => {
    const exps = [makeExp(21)];
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.policyVersion).toBe("v1-provisional");
  });

  it("explanation includes distance and eligible count", () => {
    const exps = [makeExp(14), makeExp(28), makeExp(35)];
    const result = selectPrimaryExpiration(exps, policy);
    expect(result.explanation).toContain("distance");
    expect(result.explanation).toContain("3 eligible");
  });

  it("with configurable target DTE of 30", () => {
    const custom: PrimaryExpirationPolicy = { ...policy, targetDte: 30 };
    const exps = [makeExp(14), makeExp(21), makeExp(28), makeExp(35)];
    const result = selectPrimaryExpiration(exps, custom);
    expect(result.selected!.dte).toBe(28); // closest to 30
    expect(result.distanceFromTarget).toBe(2);
  });

  it("deterministic: same input always produces same output", () => {
    const exps = [makeExp(10), makeExp(14), makeExp(21), makeExp(28), makeExp(35), makeExp(42)];
    const r1 = selectPrimaryExpiration(exps, policy);
    const r2 = selectPrimaryExpiration(exps, policy);
    expect(r1.selected!.dte).toBe(r2.selected!.dte);
    expect(r1.distanceFromTarget).toBe(r2.distanceFromTarget);
  });
});
