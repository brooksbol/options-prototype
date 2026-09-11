/**
 * Tests for the THIN Operator Console adapter hooks. These prove the adapter
 * wiring only: position → lookup-subject mapping (side selection incl.
 * buy-write → call), absolute-delta presentation, and that validity comes from
 * the shared sanitization (no Console-local rules). Validity itself is covered
 * by option-greeks / contract-greek-lookup tests.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { renderHook, waitFor } from "@testing-library/react";
import { getDurableCache, resetDurableCache, buildCacheKey } from "../../src/cache/durable-cache";
import { usePositionDeltas, usePositionGreeks } from "../../src/operator-console/use-position-deltas";
import type { MonitoredPosition } from "../../src/portfolio/position-monitoring";

const EXP = "2026-10-16";

function position(partial: Partial<MonitoredPosition> & Pick<MonitoredPosition, "id" | "type" | "underlying" | "strike" | "expiration">): MonitoredPosition {
  return { dte: 30, quantity: 1, encumberedCapital: null, capitalValuationBasis: "unavailable", capitalAsOf: null,
    moneyness: null, underlyingPrice: null, priceObservedAt: null, evidenceGeneration: null,
    acquisitionStatus: null, lastAttemptAt: null, failureCount: 0, openedDate: null, ...partial } as MonitoredPosition;
}

async function putChain(symbol: string, puts: unknown[], calls: unknown[] = []) {
  const cache = getDurableCache();
  await cache.put(cache.createRecord(
    buildCacheKey("tradier", "sandbox", "chain", symbol, EXP),
    "chain", "tradier", "sandbox", symbol, EXP,
    { symbol, expiration: EXP, underlying: { symbol, name: symbol, price: 100 }, puts, calls },
  ));
}

async function freshCache() {
  resetDurableCache();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("wheelwright-market-cache");
    req.onsuccess = () => resolve(); req.onerror = () => resolve(); req.onblocked = () => resolve();
  });
  resetDurableCache();
}

describe("usePositionDeltas (Console adapter)", () => {
  beforeEach(freshCache);

  it("returns absolute delta for a put (provider delta is negative)", async () => {
    await putChain("XLE", [{ strike: 55, delta: -0.3, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 }]);
    const positions = [position({ id: "p1", type: "put", underlying: "XLE", strike: 55, expiration: EXP })];
    const { result } = renderHook(() => usePositionDeltas(positions, 1));
    await waitFor(() => expect(result.current.get("p1")).toBe(0.3));
  });

  it("returns raw magnitude for a call (provider delta positive)", async () => {
    await putChain("XLE", [], [{ strike: 55, delta: 0.7, gamma: 0.02, theta: -0.03, vega: 0.06, rho: 0.02 }]);
    const positions = [position({ id: "c1", type: "call", underlying: "XLE", strike: 55, expiration: EXP })];
    const { result } = renderHook(() => usePositionDeltas(positions, 1));
    await waitFor(() => expect(result.current.get("c1")).toBe(0.7));
  });

  it("null when delta is out of domain (invalid)", async () => {
    await putChain("XLE", [{ strike: 55, delta: 2.0, gamma: 0.04 }]);
    const positions = [position({ id: "p1", type: "put", underlying: "XLE", strike: 55, expiration: EXP })];
    const { result } = renderHook(() => usePositionDeltas(positions, 1));
    await waitFor(() => expect(result.current.get("p1")).toBeNull());
  });
});

describe("usePositionGreeks (Console adapter)", () => {
  beforeEach(freshCache);

  it("maps a buy-write position to the CALL side", async () => {
    await putChain("XLE",
      [{ strike: 55, delta: -0.3, gamma: 0.99, theta: -0.9, vega: 0.9, rho: 0.9 }],   // put side (should NOT be used)
      [{ strike: 55, delta: 0.6, gamma: 0.02, theta: -0.03, vega: 0.06, rho: 0.02 }], // call side (expected)
    );
    const positions = [position({ id: "bw1", type: "buy-write", underlying: "XLE", strike: 55, expiration: EXP })];
    const { result } = renderHook(() => usePositionGreeks(positions, 1));
    await waitFor(() => expect(result.current.get("bw1")?.gamma).toBe(0.02));
    expect(result.current.get("bw1")?.theta).toBe(-0.03);
  });

  it("secondary greeks survive even when delta is invalid (field-level)", async () => {
    await putChain("XLE", [{ strike: 55, delta: 2.0, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 }]);
    const positions = [position({ id: "p1", type: "put", underlying: "XLE", strike: 55, expiration: EXP })];
    const dHook = renderHook(() => usePositionDeltas(positions, 1));
    const gHook = renderHook(() => usePositionGreeks(positions, 1));
    await waitFor(() => expect(gHook.result.current.get("p1")?.gamma).toBe(0.04));
    // delta invalid → delta map null, but secondary greeks preserved
    expect(dHook.result.current.get("p1")).toBeNull();
    expect(gHook.result.current.get("p1")?.theta).toBe(-0.02);
  });

  it("suppresses the all-zero placeholder vector", async () => {
    await putChain("XLE", [{ strike: 55, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }]);
    const positions = [position({ id: "p1", type: "put", underlying: "XLE", strike: 55, expiration: EXP })];
    const { result } = renderHook(() => usePositionGreeks(positions, 1));
    await waitFor(() => {
      const g = result.current.get("p1");
      expect(g?.gamma).toBeNull();
      expect(g?.theta).toBeNull();
      expect(g?.vega).toBeNull();
      expect(g?.rho).toBeNull();
    });
  });

  it("unavailable when the strike is not in the chain", async () => {
    await putChain("XLE", [{ strike: 50, delta: -0.5, gamma: 0.03, theta: -0.02, vega: 0.04, rho: 0.01 }]);
    const positions = [position({ id: "p1", type: "put", underlying: "XLE", strike: 521, expiration: EXP })];
    const { result } = renderHook(() => usePositionGreeks(positions, 1));
    await waitFor(() => {
      const g = result.current.get("p1");
      expect(g?.gamma).toBeNull();
      expect(g?.theta).toBeNull();
      expect(g?.vega).toBeNull();
      expect(g?.rho).toBeNull();
    });
  });

  it("exposes the chain acquisition age distinct from quote freshness", async () => {
    await putChain("XLE", [{ strike: 55, delta: -0.3, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 }]);
    const positions = [position({ id: "p1", type: "put", underlying: "XLE", strike: 55, expiration: EXP })];
    const { result } = renderHook(() => usePositionGreeks(positions, 1));
    await waitFor(() => {
      const g = result.current.get("p1");
      expect(g?.gamma).toBe(0.04);
      // chainRetrievedAtMs is populated from the cache record (a number, recent).
      expect(typeof g?.chainRetrievedAtMs).toBe("number");
    });
  });
});
