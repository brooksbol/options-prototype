/**
 * Mixed-authority admissibility — integration through the REAL cache + recommendation
 * engine (Issue #16; Codex re-review required test #4).
 *
 * Proves the full path snapshot -> cache -> recommendation consumption:
 *   - a Production-admissible subject survives into recommendations;
 *   - a backend-inadmissible (sandbox) subject on the SAME run cannot — no laundering;
 *   - while backend authority is pending, NOTHING is recommendation-eligible.
 *
 * We seed the durable cache the same way snapshot ingestion does (createRecord with the
 * per-subject `admissibility` verdict carried from the backend), then run recommendPuts.
 */

import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { recommendPuts } from "../../src/write-desk/recommend";
import { buildCacheKey } from "../../src/cache/durable-cache";
import { resetDB } from "../../src/cache/db";
import { resetDurableCache, getDurableCache, type SubjectAdmissibility, type DurableMarketCache } from "../../src/cache/durable-cache";

let testId = 0;

describe("mixed-authority admissibility (snapshot -> cache -> recommendation)", () => {
  let cache: DurableMarketCache;
  let env: string;
  const cacheEnv = () => ({ provider: "tradier", environment: env });

  beforeEach(() => {
    testId++;
    env = `mixauth-${testId}`;
    resetDB();
    resetDurableCache();
    cache = getDurableCache();
  });

  // Seed one symbol as snapshot ingestion would: expirations + a chain carrying the
  // backend per-subject admissibility verdict.
  async function seed(symbol: string, admissibility: SubjectAdmissibility | undefined) {
    const expKey = buildCacheKey("tradier", env, "expirations", symbol);
    await cache.put(cache.createRecord(expKey, "expirations", "tradier", env, symbol, null, [{ date: "2026-08-03", dte: 21 }]));
    const chainKey = buildCacheKey("tradier", env, "chain", symbol, "2026-08-03");
    await cache.put(cache.createRecord(
      chainKey, "chain", "tradier", env, symbol, "2026-08-03",
      {
        underlying: { symbol, name: `${symbol} Fund`, price: 100 },
        puts: [{ strike: 90, bid: 1.50, ask: 1.70, delta: -0.30, openInterest: 500, volume: 100 }],
        calls: [],
      },
      Date.now(),          // fresh
      undefined,           // evidenceProvenance
      admissibility        // Issue #16 backend verdict
    ));
  }

  const PROD_OK: SubjectAdmissibility = { admissible: true, basis: "real-time", canonicalSessionDate: "2026-08-03" };
  const SANDBOX_NO: SubjectAdmissibility = { admissible: false, basis: "delayed", canonicalSessionDate: "2026-08-02" };

  it("admissible Production subject survives; inadmissible Sandbox subject is excluded (same run)", async () => {
    await seed("PRODOK", PROD_OK);
    await seed("SBXNO", SANDBOX_NO);

    const result = await recommendPuts(["PRODOK", "SBXNO"], 500_000, cache, cacheEnv(), undefined, {
      authorityPending: false,
    });

    const symbols = [
      ...result.candidates,
      ...result.waitCandidates,
      ...result.wideSpreadCandidates,
    ].map((c) => c.symbol);

    expect(symbols).toContain("PRODOK");     // backend said admissible -> survives
    expect(symbols).not.toContain("SBXNO");  // backend said inadmissible -> cannot appear
  });

  it("authority pending: NOTHING is eligible even for a backend-admissible subject", async () => {
    await seed("PRODOK", PROD_OK);

    const result = await recommendPuts(["PRODOK"], 500_000, cache, cacheEnv(), undefined, {
      authorityPending: true,
    });

    const total = result.candidates.length + result.waitCandidates.length + result.wideSpreadCandidates.length;
    expect(total).toBe(0);
  });

  it("inadmissible verdict is not rescued by sealed-session mode (authority outranks fallback)", async () => {
    await seed("SBXNO", SANDBOX_NO);

    const result = await recommendPuts(["SBXNO"], 500_000, cache, cacheEnv(), undefined, {
      authorityPending: false,
      sessionClosed: true, // sealed-session fallback active — must NOT override the verdict
    });

    const total = result.candidates.length + result.waitCandidates.length + result.wideSpreadCandidates.length;
    expect(total).toBe(0);
  });
});
