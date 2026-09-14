/**
 * CSP funnel-export membership tests (BUG-016).
 *
 * Covers spec test requirements:
 *  1. CSP emits exactly one terminal record per monitored symbol.
 *  4. Grouping each strategy's records reproduces all visible funnel counters exactly.
 *  5. CSP Zero OI, Wide Spread, and No Delta Match exports contain every contributing symbol.
 * Addendum: sum of ALL terminal-outcome groups === displayed governed denominator (monitored).
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, type ExportContext } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import { deriveCounters } from "../../src/write-desk/funnel-export/funnel-export-types";

let testId = 0;

const EXPORT_CTX: ExportContext = {
  evidenceGeneration: 7,
  policyVersion: "routine-csp-v1-provisional",
  sessionState: "CLOSED_CANONICAL",
  canonicalSessionDate: "2026-09-14",
  evidenceEnvironment: "production",
};

describe("CSP funnel export — membership", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `csp-export-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateSymbol(symbol: string, puts: Array<{ strike: number; bid: number; ask: number; delta: number; openInterest: number; volume: number }>) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", { underlying: { symbol, name: `${symbol} Fund`, price: 100 }, puts }));
  }
  async function populateAbsent(symbol: string) {
    const absKey = buildCacheKey("tradier", env, "absence", symbol);
    await cache.put(cache.createRecord(absKey, "absence", "tradier", env, symbol, null, { reason: "no expirations" }));
  }

  it("no export result is built when no export context is supplied (byte-identical legacy path)", async () => {
    await populateSymbol("XLE", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 500, volume: 100 }]);
    const result = await recommendPuts(["XLE"], 500_000, cache, cacheEnv());
    expect(result.exportResult).toBeUndefined();
  });

  it("emits exactly one terminal record per monitored symbol (test req 1)", async () => {
    await populateSymbol("XLE", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 500, volume: 100 }]);
    await populateAbsent("NOOPT");
    // UNKNOWN has no evidence at all → incomplete
    const symbols = ["XLE", "NOOPT", "UNKNOWN"];
    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv(), undefined, { exportContext: EXPORT_CTX });

    const ex = result.exportResult!;
    expect(ex.membership).toHaveLength(symbols.length);
    // No symbol appears twice.
    const seen = ex.membership.map((r) => r.symbol);
    expect(new Set(seen).size).toBe(symbols.length);
    // Every unit is a universe symbol.
    expect(ex.membership.every((r) => r.evaluationUnitType === "universe_symbol")).toBe(true);
  });

  it("grouping by terminal_outcome reproduces funnel.outcomes exactly (test req 4)", async () => {
    await populateSymbol("ACT", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 500, volume: 100 }]);
    await populateAbsent("BOND");
    // No-delta-match: chain present but no contract in admissible delta range.
    await populateSymbol("NODELTA", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.02, openInterest: 500, volume: 100 }]);
    // Zero-OI hard-no.
    await populateSymbol("ZOI", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 0, volume: 0 }]);
    // No cached chain → incomplete.
    const symbols = ["ACT", "BOND", "NODELTA", "ZOI", "PENDING"];

    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv(), undefined, { exportContext: EXPORT_CTX });
    const ex = result.exportResult!;
    const derived = deriveCounters(ex.membership);

    // Every visible funnel outcome count is reproduced exactly by grouping membership.
    const o = result.funnel.outcomes;
    expect(derived.actionable ?? 0).toBe(o.actionable);
    expect(derived.edge ?? 0).toBe(o.edge);
    expect(derived.wait ?? 0).toBe(o.wait);
    expect(derived.hardNoZeroBid ?? 0).toBe(o.hardNoZeroBid);
    expect(derived.hardNoZeroOI ?? 0).toBe(o.hardNoZeroOI);
    expect(derived.hardNoWideSpread ?? 0).toBe(o.hardNoWideSpread);
    expect(derived.noDeltaMatch ?? 0).toBe(o.noDeltaMatch);
    expect(derived.noDteMatch ?? 0).toBe(o.noDteMatch);
    expect(derived.nonOptionable ?? 0).toBe(o.nonOptionable);
    expect(derived.incomplete ?? 0).toBe(o.incomplete);
  });

  it("sum of ALL terminal-outcome groups equals the displayed denominator (addendum)", async () => {
    await populateSymbol("ACT", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 500, volume: 100 }]);
    await populateAbsent("BOND");
    await populateSymbol("NODELTA", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.02, openInterest: 500, volume: 100 }]);
    await populateSymbol("ZOI", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 0, volume: 0 }]);
    const symbols = ["ACT", "BOND", "NODELTA", "ZOI", "PENDING"];

    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv(), undefined, { exportContext: EXPORT_CTX });
    const ex = result.exportResult!;
    const derived = deriveCounters(ex.membership);
    const total = Object.values(derived).reduce((s, n) => s + n, 0);

    expect(ex.denominator).toBe(symbols.length);
    expect(ex.membership.length).toBe(symbols.length);
    expect(total).toBe(result.funnel.monitored);
    expect(total).toBe(symbols.length);
  });

  it("visible funnel.outcomes is exactly deriveCounters(membership) — single accounting authority (test req 1/2)", async () => {
    await populateSymbol("ACT", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 500, volume: 100 }]);
    await populateAbsent("BOND");
    await populateSymbol("NODELTA", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.02, openInterest: 500, volume: 100 }]);
    await populateSymbol("ZOI", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 0, volume: 0 }]);
    const symbols = ["ACT", "BOND", "NODELTA", "ZOI", "PENDING"];

    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv(), undefined, { exportContext: EXPORT_CTX });
    const derived = deriveCounters(result.exportResult!.membership);
    const o = result.funnel.outcomes;

    // Every visible outcome key equals the membership-derived count for that key.
    for (const key of Object.keys(o) as (keyof typeof o)[]) {
      expect(o[key]).toBe(derived[key] ?? 0);
    }
    // And no membership terminal outcome is missing from the visible taxonomy.
    for (const key of Object.keys(derived)) {
      expect(o).toHaveProperty(key);
    }
  });

  it("copies exact evidence provenance into the actionable record; leaves it blank when unavailable (test req 11/12)", async () => {
    // ACT chain carries an explicit acquisition provenance → copied into the record.
    // Keep the record FRESH (default retrievedAt) so it participates in an active
    // session; provenance's acquiredAtMs is independent of freshness TTL.
    const acquiredMs = Date.parse("2026-09-14T14:16:00.000Z");
    const expKey = buildCacheKey("tradier", env, "expirations", "ACT");
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, "ACT", null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", "ACT", "2026-08-03");
    await cache.put(cache.createRecord(
      chainKey, "chain", "tradier", env, "ACT", "2026-08-03",
      { underlying: { symbol: "ACT", name: "ACT Fund", price: 100 }, puts: [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 500, volume: 100 }] },
      undefined, { kind: "chain-acquired", acquiredAtMs: acquiredMs },
    ));
    // BOND is absent → its terminal record legitimately has no evidence instant.
    await populateAbsent("BOND");

    const result = await recommendPuts(["ACT", "BOND"], 500_000, cache, cacheEnv(), undefined, { exportContext: EXPORT_CTX });
    const m = result.exportResult!.membership;
    const act = m.find((r) => r.symbol === "ACT")!;
    const bond = m.find((r) => r.symbol === "BOND")!;

    expect(act.terminalOutcome).toBe("actionable");
    expect(act.evidenceRetrievedAt).toBe(new Date(acquiredMs).toISOString());
    expect(act.expiration).toBe("2026-08-03");
    // Unavailable provenance stays blank (never synthesized).
    expect(bond.terminalOutcome).toBe("nonOptionable");
    expect(bond.evidenceRetrievedAt).toBeNull();
    expect(bond.expiration).toBeNull();
  });

  it("carries exact chain provenance on Zero OI / No Delta Match cohorts (inspected chain evidence)", async () => {
    // These branches DID inspect chain evidence, so the exact acquisition instant
    // established on the chain record must appear on their terminal records.
    const acquiredMs = Date.parse("2026-09-14T14:16:00.000Z");
    const prov = { kind: "chain-acquired" as const, acquiredAtMs: acquiredMs };

    const zoiExp = buildCacheKey("tradier", env, "expirations", "ZOI");
    await cache.put(cache.createRecord(zoiExp, "expirations", "tradier", env, "ZOI", null, [{ date: "2026-08-03", dte: 21 }]));
    const zoiChain = buildCacheKey("tradier", env, "chain", "ZOI", "2026-08-03");
    await cache.put(cache.createRecord(zoiChain, "chain", "tradier", env, "ZOI", "2026-08-03",
      { underlying: { symbol: "ZOI", name: "ZOI Fund", price: 100 }, puts: [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 0, volume: 0 }] },
      undefined, prov));

    const ndExp = buildCacheKey("tradier", env, "expirations", "ND");
    await cache.put(cache.createRecord(ndExp, "expirations", "tradier", env, "ND", null, [{ date: "2026-08-03", dte: 21 }]));
    const ndChain = buildCacheKey("tradier", env, "chain", "ND", "2026-08-03");
    await cache.put(cache.createRecord(ndChain, "chain", "tradier", env, "ND", "2026-08-03",
      { underlying: { symbol: "ND", name: "ND Fund", price: 100 }, puts: [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.02, openInterest: 500, volume: 100 }] },
      undefined, prov));

    const result = await recommendPuts(["ZOI", "ND"], 500_000, cache, cacheEnv(), undefined, { exportContext: EXPORT_CTX });
    const m = result.exportResult!.membership;
    const iso = new Date(acquiredMs).toISOString();

    const zoi = m.find((r) => r.symbol === "ZOI")!;
    const nd = m.find((r) => r.symbol === "ND")!;
    expect(zoi.terminalOutcome).toBe("hardNoZeroOI");
    expect(zoi.evidenceRetrievedAt).toBe(iso);
    expect(nd.terminalOutcome).toBe("noDeltaMatch");
    expect(nd.evidenceRetrievedAt).toBe(iso);
  });

  it("Zero OI, Wide Spread, and No Delta Match exports contain every contributing symbol (test req 5)", async () => {
    // Two zero-OI symbols.
    await populateSymbol("ZOI1", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.3, openInterest: 0, volume: 0 }]);
    await populateSymbol("ZOI2", [{ strike: 40, bid: 1.2, ask: 1.4, delta: -0.3, openInterest: 0, volume: 0 }]);
    // Two no-delta-match symbols (delta out of admissible range).
    await populateSymbol("ND1", [{ strike: 50, bid: 1.5, ask: 1.7, delta: -0.02, openInterest: 500, volume: 100 }]);
    await populateSymbol("ND2", [{ strike: 60, bid: 2.0, ask: 2.2, delta: -0.90, openInterest: 500, volume: 100 }]);
    // One wide-spread symbol: spread > hard-no floor but bid>0 and OI>0 → WIDE_SPREAD posture.
    await populateSymbol("WIDE", [{ strike: 50, bid: 0.20, ask: 3.00, delta: -0.30, openInterest: 400, volume: 50 }]);

    const symbols = ["ZOI1", "ZOI2", "ND1", "ND2", "WIDE"];
    const result = await recommendPuts(symbols, 500_000, cache, cacheEnv(), undefined, { exportContext: EXPORT_CTX });
    const m = result.exportResult!.membership;

    const bySymbol = (outcome: string) => m.filter((r) => r.terminalOutcome === outcome).map((r) => r.symbol).sort();
    expect(bySymbol("hardNoZeroOI")).toEqual(["ZOI1", "ZOI2"]);
    expect(bySymbol("noDeltaMatch")).toEqual(["ND1", "ND2"]);
    expect(bySymbol("hardNoWideSpread")).toEqual(["WIDE"]);
  });
});
