/**
 * Classification Governance Tests
 *
 * Architecture:
 *   Evidence governs visibility — all evaluated symbols appear in recommendations.
 *   Policy governs authorization — governance annotation indicates what is permitted.
 *   Explanation connects the two — classification details available for inspection.
 *
 * Invariant:
 *   Unknown evidence may restrict authorization, but it must never silently authorize.
 *   Visibility is never reduced by governance — only authorization status changes.
 *
 * Proves:
 * 1. Leveraged/inverse ETFs are VISIBLE with governance: "danger"
 * 2. Conventional ETFs are VISIBLE with governance: "authorized"
 * 3. Missing classification evidence produces governance: "unknown"
 * 4. The recommendation path passes chain.underlying.name to classification
 * 5. Governance annotation is independent of recommendation posture
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";

let testId = 0;

describe("classification governance — visibility vs authorization", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `gov-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateWithName(symbol: string, name: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      underlying: { symbol, name, price: 100 },
      puts: [{ strike: 90, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
      calls: [],
    }));
  }

  async function populateWithoutName(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      puts: [{ strike: 90, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
      calls: [],
    }));
  }

  // --- Leveraged/Inverse: VISIBLE with DANGER governance ---

  it("SOXL is visible with governance: danger", async () => {
    await populateWithName("SOXL", "Direxion Daily Semiconductor Bull 3X Shares");
    const result = await recommendPuts(["SOXL"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("danger");
    expect(result.candidates[0].posture).toBe("ACTIONABLE"); // execution quality is fine
  });

  it("TECL is visible with governance: danger", async () => {
    await populateWithName("TECL", "Direxion Daily Technology Bull 3X Shares");
    const result = await recommendPuts(["TECL"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("TQQQ is visible with governance: danger", async () => {
    await populateWithName("TQQQ", "ProShares UltraPro QQQ");
    const result = await recommendPuts(["TQQQ"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("GUSH is visible with governance: danger", async () => {
    await populateWithName("GUSH", "Direxion Daily S&P Oil & Gas Exp. & Prod. Bull 2X Shares");
    const result = await recommendPuts(["GUSH"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("URTY is visible with governance: danger", async () => {
    await populateWithName("URTY", "ProShares UltraPro Russell2000");
    const result = await recommendPuts(["URTY"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("QLD is visible with governance: danger", async () => {
    await populateWithName("QLD", "ProShares Ultra QQQ");
    const result = await recommendPuts(["QLD"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("SOXS (inverse) is visible with governance: danger", async () => {
    await populateWithName("SOXS", "Direxion Daily Semiconductor Bear 3X Shares");
    const result = await recommendPuts(["SOXS"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  // --- Conventional ETFs: VISIBLE with AUTHORIZED governance ---

  it("XLE is visible with governance: authorized", async () => {
    await populateWithName("XLE", "Energy Select Sector SPDR Fund");
    const result = await recommendPuts(["XLE"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("authorized");
  });

  it("XLK is visible with governance: authorized", async () => {
    await populateWithName("XLK", "Technology Select Sector SPDR Fund");
    const result = await recommendPuts(["XLK"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("authorized");
  });

  // --- Missing name: VISIBLE with UNKNOWN governance ---

  it("symbol with no name evidence has governance: unknown", async () => {
    await populateWithoutName("MYSTERY");
    const result = await recommendPuts(["MYSTERY"], 500_000, cache, cacheEnv());
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).toBe("unknown");
  });

  it("unknown governance does not silently authorize", async () => {
    await populateWithoutName("NONAME");
    const result = await recommendPuts(["NONAME"], 500_000, cache, cacheEnv());
    // Visible — but NOT authorized
    expect(result.candidates.length).toBe(1);
    expect(result.candidates[0].governance.status).not.toBe("authorized");
    expect(result.candidates[0].governance.status).toBe("unknown");
  });

  // --- Governance is independent of recommendation posture ---

  it("governance and posture are orthogonal", async () => {
    await populateWithName("SOXL", "Direxion Daily Semiconductor Bull 3X Shares");
    await populateWithName("XLE", "Energy Select Sector SPDR Fund");
    const result = await recommendPuts(["SOXL", "XLE"], 500_000, cache, cacheEnv());

    const soxl = result.candidates.find(c => c.symbol === "SOXL");
    const xle = result.candidates.find(c => c.symbol === "XLE");

    // Both have valid execution posture
    expect(soxl?.posture).toBe("ACTIONABLE");
    expect(xle?.posture).toBe("ACTIONABLE");

    // But different governance
    expect(soxl?.governance.status).toBe("danger");
    expect(xle?.governance.status).toBe("authorized");
  });

  it("danger governance includes classification evidence", async () => {
    await populateWithName("SOXL", "Direxion Daily Semiconductor Bull 3X Shares");
    const result = await recommendPuts(["SOXL"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;
    expect(gov.classification).toBeDefined();
    expect(gov.classification?.leveraged).toBe(true);
    expect(gov.classification?.dailyReset).toBe(true);
    expect(gov.reason).toContain("LEVERAGED");
  });
});


// --- Governance Explanation Content Tests ---
// These verify the deterministic explanation data is available on candidates,
// which the RecommendationBrief component renders.

describe("governance explanation content", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `govexp-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populateWithName(symbol: string, name: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      underlying: { symbol, name, price: 100 },
      puts: [{ strike: 90, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
      calls: [],
    }));
  }

  async function populateWithoutName(symbol: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      puts: [{ strike: 90, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
      calls: [],
    }));
  }

  it("DANGER row exposes structural classification", async () => {
    await populateWithName("SOXL", "Direxion Daily Semiconductor Bull 3X Shares");
    const result = await recommendPuts(["SOXL"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;

    expect(gov.status).toBe("danger");
    expect(gov.classification).toBeDefined();
    expect(gov.classification!.leveraged).toBe(true);
    expect(gov.classification!.dailyReset).toBe(true);
    expect(gov.classification!.inverse).toBe(false);
  });

  it("DANGER row exposes classification source and confidence", async () => {
    await populateWithName("SOXL", "Direxion Daily Semiconductor Bull 3X Shares");
    const result = await recommendPuts(["SOXL"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;

    expect(gov.classification!.source).toBe("issuer_product_page");
    expect(gov.classification!.confidence).toBeDefined();
  });

  it("DANGER row carries deterministic policy result in reason", async () => {
    await populateWithName("TQQQ", "ProShares UltraPro QQQ");
    const result = await recommendPuts(["TQQQ"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;

    expect(gov.reason).toContain("LEVERAGED");
    expect(gov.status).toBe("danger");
  });

  it("UNKNOWN row carries uncertainty explanation", async () => {
    await populateWithoutName("MYSTERY");
    const result = await recommendPuts(["MYSTERY"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;

    expect(gov.status).toBe("unknown");
    expect(gov.reason).toContain("could not be determined");
  });

  it("AUTHORIZED row has no danger or unknown signal", async () => {
    await populateWithName("XLE", "Energy Select Sector SPDR Fund");
    const result = await recommendPuts(["XLE"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;

    expect(gov.status).toBe("authorized");
    // Catalog-sourced AUTHORIZED may include classification evidence
    // No false warning
    expect(gov.reason).not.toContain("danger");
    expect(gov.reason).not.toContain("could not be determined");
  });

  it("inverse daily-reset product has inverse-specific explanation data", async () => {
    await populateWithName("SOXS", "Direxion Daily Semiconductor Bear 3X Shares");
    const result = await recommendPuts(["SOXS"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;

    expect(gov.classification!.inverse).toBe(true);
    expect(gov.classification!.dailyReset).toBe(true);
    expect(gov.classification!.leveraged).toBe(true);
  });
});
