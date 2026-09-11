/**
 * Tests for the shared contract-greek lookup — the matching + sanitization seam
 * both surfaces use. Exercises the real DurableMarketCache (fake-indexeddb).
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { getDurableCache, resetDurableCache, buildCacheKey } from "../../src/cache/durable-cache";
import { lookupContractGreeks, lookupContractGreeksWithAge } from "../../src/write-desk/contract-greek-lookup";
import type { EvidenceProvenance } from "../../src/write-desk/evidence-provenance";

const EXP = "2026-10-16";

async function putChain(symbol: string, puts: unknown[], calls: unknown[] = []) {
  const cache = getDurableCache();
  const rec = cache.createRecord(
    buildCacheKey("tradier", "sandbox", "chain", symbol, EXP),
    "chain", "tradier", "sandbox", symbol, EXP,
    { symbol, expiration: EXP, underlying: { symbol, name: symbol, price: 100 }, puts, calls },
  );
  await cache.put(rec);
}

/**
 * Put a chain with explicit control of BOTH the authoritative provenance and the
 * cache/TTL retrievedAt, so tests can prove Greek Age derives from provenance and
 * NEVER from retrievedAt.
 */
async function putChainWithProvenance(
  symbol: string,
  puts: unknown[],
  opts: { provenance?: EvidenceProvenance; retrievedAtMs?: number },
) {
  const cache = getDurableCache();
  const rec = cache.createRecord(
    buildCacheKey("tradier", "sandbox", "chain", symbol, EXP),
    "chain", "tradier", "sandbox", symbol, EXP,
    { symbol, expiration: EXP, underlying: { symbol, name: symbol, price: 100 }, puts, calls: [] },
    opts.retrievedAtMs,
    opts.provenance,
  );
  await cache.put(rec);
}

describe("contract-greek-lookup", () => {
  beforeEach(async () => {
    resetDurableCache();
    // fresh IndexedDB per test
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("wheelwright-market-cache");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
    resetDurableCache();
  });

  it("returns all-unavailable when no chain is cached", async () => {
    const g = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "put" });
    expect(g).toEqual({ delta: null, gamma: null, theta: null, vega: null, rho: null });
  });

  it("matches by symbol/expiration/strike/side and returns populated greeks", async () => {
    await putChain("XLE", [
      { strike: 50, delta: -0.5, gamma: 0.03, theta: -0.02, vega: 0.04, rho: 0.01 },
      { strike: 55, delta: -0.3, gamma: 0.04, theta: -0.018, vega: 0.05, rho: 0.012 },
    ]);
    const g = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "put" });
    expect(g).toEqual({ delta: -0.3, gamma: 0.04, theta: -0.018, vega: 0.05, rho: 0.012 });
  });

  it("selects the correct side (put vs call)", async () => {
    await putChain("XLE",
      [{ strike: 55, delta: -0.3, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 }],
      [{ strike: 55, delta: 0.7, gamma: 0.02, theta: -0.03, vega: 0.06, rho: 0.02 }],
    );
    const put = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "put" });
    const call = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "call" });
    expect(put.delta).toBe(-0.3);
    expect(call.delta).toBe(0.7);
  });

  it("returns all-unavailable when the strike is not present", async () => {
    await putChain("XLE", [{ strike: 50, delta: -0.5, gamma: 0.03, theta: -0.02, vega: 0.04, rho: 0.01 }]);
    const g = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 521, side: "put" });
    expect(g.delta).toBeNull();
    expect(g.gamma).toBeNull();
  });

  it("treats zero as unavailable per field; preserves finite nonzero", async () => {
    // theta exactly 0 → unavailable; rho absent → unavailable; delta/gamma/vega kept.
    await putChain("XLE", [{ strike: 55, delta: -0.3, gamma: 0.04, theta: 0, vega: 0.05 }]);
    const g = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "put" });
    expect(g.delta).toBe(-0.3);
    expect(g.gamma).toBe(0.04);
    expect(g.vega).toBe(0.05);
    expect(g.theta).toBeNull();
    expect(g.rho).toBeNull();
  });

  it("suppresses the exact all-zero provider placeholder vector", async () => {
    await putChain("XLE", [{ strike: 55, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 }]);
    const g = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "put" });
    expect(g).toEqual({ delta: null, gamma: null, theta: null, vega: null, rho: null });
  });

  it("preserves a partial vector (does not blank valid fields)", async () => {
    await putChain("XLE", [{ strike: 55, delta: -0.3, theta: -0.018 }]);
    const g = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "put" });
    expect(g.delta).toBe(-0.3);
    expect(g.theta).toBe(-0.018);
    expect(g.gamma).toBeNull();
    expect(g.vega).toBeNull();
    expect(g.rho).toBeNull();
  });

  it("invalid delta does not erase valid secondary greeks", async () => {
    await putChain("XLE", [{ strike: 55, delta: 2.0, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 }]);
    const g = await lookupContractGreeks({ symbol: "XLE", expiration: EXP, strike: 55, side: "put" });
    expect(g.delta).toBeNull();
    expect(g.gamma).toBe(0.04);
    expect(g.theta).toBe(-0.02);
  });

  describe("Greek Age authority (chainAcquiredAtMs)", () => {
    const strike = 55;
    const contract = { strike, delta: -0.3, gamma: 0.04, theta: -0.018, vega: 0.05, rho: 0.012 };

    it("uses the AUTHORITATIVE chain-acquired provenance timestamp, not retrievedAt", async () => {
      const acquiredAtMs = Date.UTC(2026, 8, 4, 20, 14, 53); // authoritative acquisition moment
      const retrievedAtMs = Date.UTC(2026, 8, 11, 12, 0, 0); // a DIFFERENT cache/TTL time
      await putChainWithProvenance("XLE", [contract], {
        provenance: { kind: "chain-acquired", acquiredAtMs },
        retrievedAtMs,
      });
      const r = await lookupContractGreeksWithAge({ symbol: "XLE", expiration: EXP, strike, side: "put" });
      expect(r.chainAcquiredAtMs).toBe(acquiredAtMs);
      // Explicitly NOT the cache/TTL timestamp.
      expect(r.chainAcquiredAtMs).not.toBe(retrievedAtMs);
    });

    it("returns null age when provenance is unavailable (never falls back to retrievedAt)", async () => {
      const retrievedAtMs = Date.UTC(2026, 8, 11, 12, 0, 0);
      await putChainWithProvenance("XLE", [contract], {
        provenance: { kind: "unavailable" },
        retrievedAtMs,
      });
      const r = await lookupContractGreeksWithAge({ symbol: "XLE", expiration: EXP, strike, side: "put" });
      expect(r.chainAcquiredAtMs).toBeNull();
      // Greeks themselves still resolve — only the AGE is honestly unknown.
      expect(r.greeks.delta).toBe(-0.3);
    });

    it("returns null age when the record carries no provenance at all", async () => {
      // putChain writes no evidenceProvenance (createRecord defaults retrievedAt to Date.now()).
      await putChain("XLE", [contract]);
      const r = await lookupContractGreeksWithAge({ symbol: "XLE", expiration: EXP, strike, side: "put" });
      expect(r.chainAcquiredAtMs).toBeNull();
    });

    it("returns null age when there is no cached chain", async () => {
      // Use a symbol never inserted in this block, independent of cache-reset timing.
      const r = await lookupContractGreeksWithAge({ symbol: "NEVERCACHED", expiration: EXP, strike, side: "put" });
      expect(r.chainAcquiredAtMs).toBeNull();
      expect(r.greeks.delta).toBeNull();
    });
  });
});
