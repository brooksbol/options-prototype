/**
 * Instrument Catalog Tests
 *
 * Proves:
 * 1. Catalog records override name heuristics
 * 2. SOXL, USD, TECL, TQQQ, UCO, QLD → DANGER from catalog
 * 3. USO → REVIEW from catalog
 * 4. SMH, SPMO, XLE → AUTHORIZED from catalog
 * 5. Uncataloged instrument follows heuristic path
 * 6. Provenance and policyCode survive into recommendation candidate
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts, DEFAULT_RECOMMENDATION_POLICY } from "../../src/write-desk/recommend";
import { DurableMarketCache, buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache } from "../../src/cache/durable-cache";
import { lookupCatalog, catalogSize } from "../../src/instrument-catalog/catalog";

let testId = 0;

describe("instrument catalog — lookup", () => {
  it("catalog contains 10 pilot instruments", () => {
    expect(catalogSize()).toBe(10);
  });

  it("SOXL is in catalog with DANGER", () => {
    const record = lookupCatalog("SOXL");
    expect(record).not.toBeNull();
    expect(record!.governance.status).toBe("DANGER");
    expect(record!.governance.policyCode).toBe("LEVERAGED_DAILY_PRODUCT");
  });

  it("USO is in catalog with REVIEW", () => {
    const record = lookupCatalog("USO");
    expect(record).not.toBeNull();
    expect(record!.governance.status).toBe("REVIEW");
    expect(record!.governance.policyCode).toBe("NON_STANDARD_FUTURES_STRUCTURE");
  });

  it("XLE is in catalog with AUTHORIZED", () => {
    const record = lookupCatalog("XLE");
    expect(record).not.toBeNull();
    expect(record!.governance.status).toBe("AUTHORIZED");
  });

  it("uncataloged symbol returns null", () => {
    expect(lookupCatalog("AAPL")).toBeNull();
    expect(lookupCatalog("RANDOMTICKER")).toBeNull();
  });
});

describe("instrument catalog — recommendation governance", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `cat-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  async function populate(symbol: string, name: string) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(chainKey, "chain", "tradier", env, symbol, "2026-08-03", {
      underlying: { symbol, name, price: 100 },
      puts: [{ strike: 90, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
      calls: [],
    }));
  }

  // --- DANGER from catalog ---

  it("SOXL resolves DANGER from catalog (not heuristic)", async () => {
    await populate("SOXL", "Direxion Daily Semiconductor Bull 3X Shares");
    const result = await recommendPuts(["SOXL"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("danger");
    expect(result.candidates[0].governance.classification?.source).toBe("issuer_product_page");
    expect(result.candidates[0].governance.policyCode).toBe("LEVERAGED_DAILY_PRODUCT");
  });

  it("USD resolves DANGER from catalog", async () => {
    await populate("USD", "ProShares Ultra Semiconductors");
    const result = await recommendPuts(["USD"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("danger");
    expect(result.candidates[0].governance.policyCode).toBe("LEVERAGED_DAILY_PRODUCT");
  });

  it("TECL resolves DANGER from catalog", async () => {
    await populate("TECL", "Direxion Daily Technology Bull 3X Shares");
    const result = await recommendPuts(["TECL"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("TQQQ resolves DANGER from catalog", async () => {
    await populate("TQQQ", "ProShares UltraPro QQQ");
    const result = await recommendPuts(["TQQQ"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("UCO resolves DANGER from catalog", async () => {
    await populate("UCO", "ProShares Ultra Bloomberg Crude Oil");
    const result = await recommendPuts(["UCO"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  it("QLD resolves DANGER from catalog", async () => {
    await populate("QLD", "ProShares Ultra QQQ");
    const result = await recommendPuts(["QLD"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("danger");
  });

  // --- REVIEW from catalog ---

  it("USO resolves REVIEW from catalog", async () => {
    await populate("USO", "United States Oil Fund");
    const result = await recommendPuts(["USO"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("review");
    expect(result.candidates[0].governance.policyCode).toBe("NON_STANDARD_FUTURES_STRUCTURE");
  });

  // --- AUTHORIZED from catalog ---

  it("SMH resolves AUTHORIZED from catalog", async () => {
    await populate("SMH", "VanEck Semiconductor ETF");
    const result = await recommendPuts(["SMH"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("authorized");
  });

  it("SPMO resolves AUTHORIZED from catalog", async () => {
    await populate("SPMO", "Invesco S&P 500 Momentum ETF");
    const result = await recommendPuts(["SPMO"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("authorized");
  });

  it("XLE resolves AUTHORIZED from catalog", async () => {
    await populate("XLE", "Energy Select Sector SPDR Fund");
    const result = await recommendPuts(["XLE"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("authorized");
  });

  // --- Catalog overrides heuristic ---

  it("catalog takes precedence over name heuristic", async () => {
    // SMH with a misleading name — catalog should still say AUTHORIZED
    await populate("SMH", "Ultra Something Bull 3X Daily Semiconductor");
    const result = await recommendPuts(["SMH"], 500_000, cache, cacheEnv());
    // Catalog wins: SMH is AUTHORIZED regardless of name
    expect(result.candidates[0].governance.status).toBe("authorized");
    expect(result.candidates[0].governance.classification?.source).toBe("issuer_product_page");
  });

  // --- Uncataloged follows heuristic ---

  it("uncataloged instrument with dangerous name uses heuristic", async () => {
    await populate("NEWLEV", "Some New Daily Bull 3X Leveraged Fund");
    const result = await recommendPuts(["NEWLEV"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("danger");
    // Source is heuristic, not catalog
    expect(result.candidates[0].governance.classification?.source).toBe("name_heuristic");
  });

  it("uncataloged conventional instrument uses heuristic", async () => {
    await populate("NEWETF", "Generic Large Cap Growth ETF");
    const result = await recommendPuts(["NEWETF"], 500_000, cache, cacheEnv());
    expect(result.candidates[0].governance.status).toBe("authorized");
  });

  // --- Provenance survives ---

  it("catalog provenance and policyCode survive to candidate", async () => {
    await populate("SOXL", "Direxion Daily Semiconductor Bull 3X Shares");
    const result = await recommendPuts(["SOXL"], 500_000, cache, cacheEnv());
    const gov = result.candidates[0].governance;
    expect(gov.policyCode).toBe("LEVERAGED_DAILY_PRODUCT");
    expect(gov.classification?.source).toBe("issuer_product_page");
    expect(gov.classification?.confidence).toBe("high");
    expect(gov.classification?.leveraged).toBe(true);
    expect(gov.classification?.dailyReset).toBe(true);
  });
});
