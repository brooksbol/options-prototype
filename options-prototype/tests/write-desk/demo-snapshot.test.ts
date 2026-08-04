/**
 * Tests for the demo portfolio snapshot.
 *
 * These verify structural correctness of the showcase demo fixture.
 * They do NOT test specific position counts or dollar values (those are
 * design choices that evolve as capabilities are added).
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
    expect(snapshot.deployableCash).toBeGreaterThan(0);
    expect(snapshot.balanceContext?.availableToTrade).toBe(snapshot.deployableCash);
  });

  it("has at least one position with free call capacity", () => {
    const withCapacity = snapshot.inventory.filter((p) => p.maxAdditionalContracts > 0);
    expect(withCapacity.length).toBeGreaterThan(0);
  });

  it("has at least one fully encumbered position", () => {
    const encumbered = snapshot.inventory.filter((p) => p.sharesEncumbered >= p.sharesOwned);
    expect(encumbered.length).toBeGreaterThan(0);
  });

  it("has at least one partially encumbered position", () => {
    const partial = snapshot.inventory.filter((p) => p.sharesEncumbered > 0 && p.sharesEncumbered < p.sharesOwned);
    expect(partial.length).toBeGreaterThan(0);
  });

  it("has existing short puts", () => {
    expect(snapshot.existingPuts.length).toBeGreaterThan(0);
    expect(snapshot.existingPuts[0].underlying).toBeDefined();
    expect(snapshot.existingPuts[0].strike).toBeGreaterThan(0);
  });

  it("has existing short calls", () => {
    expect(snapshot.existingCalls.length).toBeGreaterThan(0);
  });

  it("has multiple distinct expirations for ladder testing", () => {
    const putExps = new Set(snapshot.existingPuts.map(p => p.expiration));
    const callExps = new Set(snapshot.existingCalls.map(c => c.expiration));
    const allExps = new Set([...putExps, ...callExps]);
    expect(allExps.size).toBeGreaterThanOrEqual(3);
  });

  it("has positions sharing an expiration (rung density)", () => {
    const expCounts = new Map<string, number>();
    for (const p of [...snapshot.existingPuts, ...snapshot.existingCalls]) {
      expCounts.set(p.expiration, (expCounts.get(p.expiration) ?? 0) + 1);
    }
    const shared = [...expCounts.values()].filter(c => c > 1);
    expect(shared.length).toBeGreaterThan(0);
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
});
