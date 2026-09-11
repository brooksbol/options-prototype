/**
 * Tests for shared snapshot→cache chain ingestion.
 * Proves Issue #16 admissibility propagation, provenance travel, per-expiration
 * association, and that greek payload fields (including nulls) survive ingestion
 * unchanged. Uses the real DurableMarketCache (fake-indexeddb).
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { getDurableCache, resetDurableCache, buildCacheKey } from "../../src/cache/durable-cache";
import { ingestChainsFromSnapshot } from "../../src/evidence/chain-cache-ingestion";

async function freshCache() {
  resetDurableCache();
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase("wheelwright-market-cache");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
  resetDurableCache();
}

function chainData(symbol: string, expiration: string, puts: unknown[]) {
  return { symbol, expiration, underlying: { symbol, name: symbol, price: 100 }, puts, calls: [] };
}

async function getChainRecord(symbol: string, expiration: string) {
  return getDurableCache().get(buildCacheKey("tradier", "sandbox", "chain", symbol, expiration));
}

describe("chain-cache-ingestion", () => {
  beforeEach(freshCache);

  it("carries chains[].admissibility onto the matching cache record", async () => {
    const snapshot = {
      symbols: [{
        symbol: "XLE",
        status: "ready",
        retrievedAt: "2026-10-16T14:30:00Z",
        chain: chainData("XLE", "2026-10-16", []),
        chains: [
          {
            expiration: "2026-10-16",
            data: chainData("XLE", "2026-10-16", [{ strike: 55, delta: -0.3, gamma: 0.04, theta: -0.02, vega: 0.05, rho: 0.01 }]),
            retrievedAt: "2026-10-16T14:30:00Z",
            chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: "2026-10-16T14:30:00Z" },
            admissibility: { admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-16" },
          },
        ],
      }],
    };
    const merged = await ingestChainsFromSnapshot(snapshot);
    expect(merged).toBe(1);

    const rec: any = await getChainRecord("XLE", "2026-10-16");
    expect(rec).not.toBeNull();
    expect(rec.admissibility).toEqual({ admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-16" });
  });

  it("carries primaryChainAdmissibility on the legacy single-chain path", async () => {
    const snapshot = {
      symbols: [{
        symbol: "XLF",
        status: "ready",
        retrievedAt: "2026-10-16T14:30:00Z",
        chain: chainData("XLF", "2026-10-16", [{ strike: 40, delta: -0.25, gamma: 0.03, theta: -0.01, vega: 0.02, rho: 0.005 }]),
        // no chains[] → legacy path
        primaryChainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: "2026-10-16T14:30:00Z" },
        primaryChainAdmissibility: { admissible: false, basis: "delayed", canonicalSessionDate: "2026-10-16" },
      }],
    };
    await ingestChainsFromSnapshot(snapshot);
    const rec: any = await getChainRecord("XLF", "2026-10-16");
    expect(rec.admissibility).toEqual({ admissible: false, basis: "delayed", canonicalSessionDate: "2026-10-16" });
  });

  it("associates admissibility per-expiration across a multi-DTE surface", async () => {
    const snapshot = {
      symbols: [{
        symbol: "XLE",
        status: "ready",
        retrievedAt: "2026-10-16T14:30:00Z",
        chain: chainData("XLE", "2026-10-16", []),
        chains: [
          {
            expiration: "2026-10-16",
            data: chainData("XLE", "2026-10-16", [{ strike: 55, delta: -0.3 }]),
            chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: "2026-10-16T14:30:00Z" },
            admissibility: { admissible: true, basis: "real-time", canonicalSessionDate: "2026-10-16" },
          },
          {
            expiration: "2026-10-23",
            data: chainData("XLE", "2026-10-23", [{ strike: 55, delta: -0.28 }]),
            chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: "2026-10-16T14:30:00Z" },
            admissibility: { admissible: false, basis: "delayed", canonicalSessionDate: "2026-10-16" },
          },
        ],
      }],
    };
    await ingestChainsFromSnapshot(snapshot);
    const a: any = await getChainRecord("XLE", "2026-10-16");
    const b: any = await getChainRecord("XLE", "2026-10-23");
    expect(a.admissibility.basis).toBe("real-time");
    expect(b.admissibility.basis).toBe("delayed");
  });

  it("leaves admissibility undefined when the snapshot omits it", async () => {
    const snapshot = {
      symbols: [{
        symbol: "XLE",
        status: "ready",
        retrievedAt: "2026-10-16T14:30:00Z",
        chain: chainData("XLE", "2026-10-16", [{ strike: 55, delta: -0.3 }]),
        chains: [{
          expiration: "2026-10-16",
          data: chainData("XLE", "2026-10-16", [{ strike: 55, delta: -0.3 }]),
          chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: "2026-10-16T14:30:00Z" },
          // no admissibility
        }],
      }],
    };
    await ingestChainsFromSnapshot(snapshot);
    const rec: any = await getChainRecord("XLE", "2026-10-16");
    expect(rec.admissibility).toBeUndefined();
  });

  it("carries chain-acquisition provenance", async () => {
    const snapshot = {
      symbols: [{
        symbol: "XLE",
        status: "ready",
        retrievedAt: "2026-10-16T14:30:00Z",
        chain: chainData("XLE", "2026-10-16", [{ strike: 55, delta: -0.3 }]),
        chains: [{
          expiration: "2026-10-16",
          data: chainData("XLE", "2026-10-16", [{ strike: 55, delta: -0.3 }]),
          chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: "2026-10-16T14:30:00Z" },
        }],
      }],
    };
    await ingestChainsFromSnapshot(snapshot);
    const rec: any = await getChainRecord("XLE", "2026-10-16");
    expect(rec.evidenceProvenance).toEqual({ kind: "chain-acquired", acquiredAtMs: Date.parse("2026-10-16T14:30:00Z") });
  });

  it("preserves greek payload fields, including explicit nulls, unchanged", async () => {
    const puts = [{ strike: 55, delta: -0.3, gamma: null, theta: 0, vega: 0.05, rho: null }];
    const snapshot = {
      symbols: [{
        symbol: "XLE",
        status: "ready",
        retrievedAt: "2026-10-16T14:30:00Z",
        chain: chainData("XLE", "2026-10-16", puts),
        chains: [{
          expiration: "2026-10-16",
          data: chainData("XLE", "2026-10-16", puts),
          chainAcquisitionProvenance: { kind: "chain-acquired", acquiredAt: "2026-10-16T14:30:00Z" },
        }],
      }],
    };
    await ingestChainsFromSnapshot(snapshot);
    const rec: any = await getChainRecord("XLE", "2026-10-16");
    const p = rec.payload.puts[0];
    // Ingestion PERSISTS raw provider facts verbatim; the "0 → unavailable"
    // trust rule is applied later at read/display (sanitizeGreeks), not here.
    expect(p.delta).toBe(-0.3);
    expect(p.gamma).toBeNull();
    expect(p.theta).toBe(0);        // raw zero stored as-is (derive trust at read)
    expect(p.vega).toBe(0.05);
    expect(p.rho).toBeNull();
  });

  it("skips non-ready symbols", async () => {
    const merged = await ingestChainsFromSnapshot({
      symbols: [{ symbol: "PEND", status: "pending" }],
    });
    expect(merged).toBe(0);
  });
});
