/**
 * Tests for trust-state derivation.
 */

import { describe, it, expect } from "vitest";
import { deriveTrustState } from "../../src/write-desk/trust-state";

const baseCoverage = { ready: 450, absent: 40, pending: 6, failed: 0 };
const baseInput = {
  coverage: baseCoverage,
  universe: 496,
  generatedAt: new Date().toISOString(),
  serviceAvailable: true,
  sessionClosed: false,
  isAcquiring: false,
};

describe("deriveTrustState", () => {
  it("Current when coverage ≥ 95% and evidence fresh", () => {
    const result = deriveTrustState(baseInput);
    expect(result.trust).toBe("current");
    expect(result.trustLabel).toBe("Current");
    expect(result.color).toBe("green");
    expect(result.activity).toBe("idle");
  });

  it("Partially Current when coverage < 95%", () => {
    const result = deriveTrustState({
      ...baseInput,
      coverage: { ready: 200, absent: 40, pending: 256, failed: 0 },
    });
    expect(result.trust).toBe("partially_current");
    expect(result.color).toBe("yellow");
  });

  it("Updating activity when isAcquiring", () => {
    const result = deriveTrustState({ ...baseInput, isAcquiring: true });
    expect(result.activity).toBe("updating");
    expect(result.trust).toBe("current"); // trust and activity are independent
  });

  it("Sealed today when session closed regardless of age", () => {
    const oldTimestamp = new Date(Date.now() - 3600_000).toISOString(); // 1 hour old
    const result = deriveTrustState({
      ...baseInput,
      generatedAt: oldTimestamp,
      sessionClosed: true,
    });
    expect(result.trust).toBe("current");
    expect(result.freshnessLabel).toBe("Sealed today");
  });

  it("Stale but Usable when evidence > 5 min but ≤ 30 min during regular session", () => {
    const staleTimestamp = new Date(Date.now() - 10 * 60_000).toISOString(); // 10 min
    const result = deriveTrustState({
      ...baseInput,
      generatedAt: staleTimestamp,
    });
    expect(result.trust).toBe("stale_but_usable");
    expect(result.color).toBe("yellow");
  });

  it("Degraded when evidence > 30 min during regular session", () => {
    const veryStale = new Date(Date.now() - 45 * 60_000).toISOString(); // 45 min
    const result = deriveTrustState({
      ...baseInput,
      generatedAt: veryStale,
    });
    expect(result.trust).toBe("degraded");
    expect(result.color).toBe("orange");
  });

  it("Degraded when failure fraction > 5%", () => {
    const result = deriveTrustState({
      ...baseInput,
      coverage: { ready: 400, absent: 40, pending: 6, failed: 50 }, // 50/496 > 5%
    });
    expect(result.trust).toBe("degraded");
    expect(result.freshnessLabel).toContain("failures");
  });

  it("Unavailable when service not reachable", () => {
    const result = deriveTrustState({
      ...baseInput,
      serviceAvailable: false,
    });
    expect(result.trust).toBe("unavailable");
    expect(result.color).toBe("red");
  });

  it("Unavailable when no coverage data", () => {
    const result = deriveTrustState({
      ...baseInput,
      coverage: null,
    });
    expect(result.trust).toBe("unavailable");
  });

  it("covered count = ready + absent", () => {
    const result = deriveTrustState(baseInput);
    expect(result.covered).toBe(490); // 450 + 40
  });

  it("trust and activity are independent", () => {
    // Can be current AND updating
    const currentUpdating = deriveTrustState({ ...baseInput, isAcquiring: true });
    expect(currentUpdating.trust).toBe("current");
    expect(currentUpdating.activity).toBe("updating");

    // Can be degraded AND idle
    const degradedIdle = deriveTrustState({
      ...baseInput,
      generatedAt: new Date(Date.now() - 45 * 60_000).toISOString(),
      isAcquiring: false,
    });
    expect(degradedIdle.trust).toBe("degraded");
    expect(degradedIdle.activity).toBe("idle");
  });
});
