/**
 * Tests for the demo portfolio snapshot.
 */

import { describe, it, expect } from "vitest";
import { createDemoSnapshot } from "../../src/write-desk/demo-snapshot";

describe("createDemoSnapshot", () => {
  const snapshot = createDemoSnapshot();

  it("produces a READY snapshot", () => {
    expect(snapshot.readiness.status).toBe("READY");
    expect(snapshot.readiness.blockReasons).toHaveLength(0);
  });

  it("has demo source type", () => {
    expect(snapshot.source.type).toBe("demo");
    expect(snapshot.provenance.sourceType).toBe("demo");
  });

  it("provides deployable cash", () => {
    expect(snapshot.deployableCash).toBe(18500);
    expect(snapshot.balanceContext?.availableToTrade).toBe(18500);
  });

  it("has at least one position with free call capacity", () => {
    const withCapacity = snapshot.inventory.filter((p) => p.maxAdditionalContracts > 0);
    expect(withCapacity.length).toBeGreaterThan(0);
    // XLE has 100 free shares → 1 contract
    const xle = snapshot.inventory.find((p) => p.symbol === "XLE");
    expect(xle?.sharesFree).toBe(100);
    expect(xle?.maxAdditionalContracts).toBe(1);
  });

  it("has at least one fully encumbered position", () => {
    const encumbered = snapshot.inventory.filter((p) => p.sharesEncumbered >= p.sharesOwned);
    expect(encumbered.length).toBeGreaterThan(0);
    // QQQ is fully encumbered
    const qqq = snapshot.inventory.find((p) => p.symbol === "QQQ");
    expect(qqq?.maxAdditionalContracts).toBe(0);
    expect(qqq?.sharesEncumbered).toBe(300);
  });

  it("has at least one sub-100-share position", () => {
    const small = snapshot.inventory.filter((p) => p.sharesOwned < 100);
    expect(small.length).toBeGreaterThan(0);
  });

  it("has existing short puts", () => {
    expect(snapshot.existingPuts.length).toBeGreaterThan(0);
    expect(snapshot.existingPuts[0].underlying).toBeDefined();
    expect(snapshot.existingPuts[0].strike).toBeGreaterThan(0);
  });

  it("has existing short calls", () => {
    expect(snapshot.existingCalls.length).toBeGreaterThan(0);
  });

  it("is deterministic (same output on repeated calls)", () => {
    const a = createDemoSnapshot();
    const b = createDemoSnapshot();
    expect(a.id).toBe(b.id);
    expect(a.deployableCash).toBe(b.deployableCash);
    expect(a.inventory).toEqual(b.inventory);
    expect(a.existingPuts).toEqual(b.existingPuts);
    expect(a.existingCalls).toEqual(b.existingCalls);
  });

  it("source switching invalidates: demo snapshot has distinct id", () => {
    // If source switches, the previous snapshot should not be reused
    expect(snapshot.id).toBe("demo-portfolio-v1");
  });
});
