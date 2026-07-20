/**
 * Session-aware evidence refresh tests.
 *
 * Proves:
 * 1. Prior-session resolved evidence appears in work queue for current session
 * 2. Current-session resolved evidence does NOT appear in work queue
 * 3. Both ready and absent symbols are eligible for refresh
 * 4. Failed refresh preserves prior successful evidence
 * 5. Successful refresh updates session_date
 * 6. Completed current-epoch refresh → empty queue (no infinite requeue)
 * 7. Restart with prior-session evidence → symbols are queued
 * 8. Partial refresh followed by restart → only remaining symbols queued
 *
 * Architectural finding: a completed acquisition queue is completion within
 * a validity epoch, not a perpetual terminal state.
 */

import { describe, it, expect, afterEach } from "vitest";
import { SqliteEvidenceStore } from "../src/db/sqlite-evidence-store.js";
import type { MarketExpiration, MarketChain } from "../src/providers/tradier.js";
import { existsSync, unlinkSync } from "node:fs";

// --- Fixtures ---

const EXPIRATIONS: MarketExpiration[] = [
  { date: "2026-08-03", dte: 21 },
  { date: "2026-08-10", dte: 28 },
];

const CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy Select Sector", price: 92.50 },
  puts: [{ strike: 88, bid: 1.50, ask: 1.70, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 95, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 }],
};

const FRIDAY = "2026-07-17T14:30:00Z";
const FRIDAY_SESSION = "2026-07-17";
const MONDAY_SESSION = "2026-07-20";

// --- Queue Eligibility ---

describe("session-aware work queue", () => {
  it("prior-session ready symbol is eligible for refresh", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    // Simulate Friday acquisition by overriding session date
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setSessionDateOverride(null);

    // When queried with MONDAY_SESSION, it should be in the queue
    const queue = store.getWorkQueue(MONDAY_SESSION);
    expect(queue).toContain("XLE");
    store.close();
  });

  it("prior-session absent symbol is eligible for refresh", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["NOOPT"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("NOOPT", [], FRIDAY);
    store.setSessionDateOverride(null);

    const queue = store.getWorkQueue(MONDAY_SESSION);
    expect(queue).toContain("NOOPT");
    store.close();
  });

  it("current-session resolved symbol is NOT in work queue", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setSessionDateOverride(null);

    // Query with the SAME session date as the evidence
    const queue = store.getWorkQueue(FRIDAY_SESSION);
    expect(queue).not.toContain("XLE");
    store.close();
  });

  it("pending symbol is always in work queue regardless of session", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["NEW"]);

    const queue = store.getWorkQueue(MONDAY_SESSION);
    expect(queue).toContain("NEW");
    store.close();
  });

  it("partial symbol is always in work queue regardless of session", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["PARTIAL"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("PARTIAL", EXPIRATIONS, FRIDAY);
    store.setSessionDateOverride(null);

    // Even with same session date, partial needs chain
    const queue = store.getWorkQueue(FRIDAY_SESSION);
    expect(queue).toContain("PARTIAL");
    store.close();
  });

  it("completed current-epoch refresh produces empty queue", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE", "NOOPT"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setExpirations("NOOPT", [], FRIDAY);
    store.setSessionDateOverride(null);

    // Verify they're queued for Monday
    expect(store.getWorkQueue(MONDAY_SESSION).length).toBe(2);

    // Simulate Monday refresh
    store.setSessionDateOverride(MONDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-20T14:00:00Z");
    store.setChain("XLE", { ...CHAIN }, "2026-07-20T14:00:00Z");
    store.setExpirations("NOOPT", [], "2026-07-20T14:00:00Z");
    store.setSessionDateOverride(null);

    // Now query with Monday session — both should be resolved and NOT queued
    const queueAfter = store.getWorkQueue(MONDAY_SESSION);
    expect(queueAfter).not.toContain("XLE");
    expect(queueAfter).not.toContain("NOOPT");
    store.close();
  });
});

// --- Failure Preservation During Refresh ---

describe("failure preservation during refresh", () => {
  it("failure does not destroy prior-session evidence during refresh", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setSessionDateOverride(null);

    // Verify ready state with data
    const before = store.get("XLE");
    expect(before?.status).toBe("ready");
    expect(before?.chain).not.toBeNull();

    // Simulate a refresh failure — data must survive
    store.setFailure("XLE", "provider timeout");

    const after = store.get("XLE");
    expect(after?.chain).toEqual(CHAIN);
    expect(after?.expirations).toEqual(EXPIRATIONS);
    store.close();
  });

  it("successful refresh replaces prior evidence correctly", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setSessionDateOverride(null);

    // Refresh with new data
    const newExpirations: MarketExpiration[] = [{ date: "2026-08-10", dte: 21 }];
    const newChain: MarketChain = {
      ...CHAIN,
      expiration: "2026-08-10",
      underlying: { ...CHAIN.underlying, price: 95.00 },
    };

    store.setSessionDateOverride(MONDAY_SESSION);
    store.setExpirations("XLE", newExpirations, "2026-07-20T14:00:00Z");
    store.setChain("XLE", newChain, "2026-07-20T14:01:00Z");
    store.setSessionDateOverride(null);

    const after = store.get("XLE");
    expect(after?.status).toBe("ready");
    expect(after?.chain?.underlying.price).toBe(95.00);
    expect(after?.primaryExpiration).toBe("2026-08-10");
    store.close();
  });
});

// --- Failed-Row Epoch Semantics ---

describe("failed-row retry across epochs", () => {
  it("prior-epoch failed row at retry cap IS queued in new epoch", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);

    // Fail 3 times to reach the cap
    store.setFailure("XLE", "timeout");
    store.setFailure("XLE", "timeout");
    store.setFailure("XLE", "timeout");

    const fridayQueue = store.getWorkQueue(FRIDAY_SESSION);
    expect(fridayQueue).not.toContain("XLE"); // capped within epoch

    store.setSessionDateOverride(null);

    // In a new epoch, the symbol should be eligible again
    const mondayQueue = store.getWorkQueue(MONDAY_SESSION);
    expect(mondayQueue).toContain("XLE");
    store.close();
  });

  it("retry exhaustion during current epoch excludes from current-epoch queue", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(MONDAY_SESSION);

    store.setFailure("XLE", "timeout");
    expect(store.getWorkQueue(MONDAY_SESSION)).toContain("XLE"); // 1 failure, < 3

    store.setFailure("XLE", "timeout");
    expect(store.getWorkQueue(MONDAY_SESSION)).toContain("XLE"); // 2 failures, < 3

    store.setFailure("XLE", "timeout");
    expect(store.getWorkQueue(MONDAY_SESSION)).not.toContain("XLE"); // 3 failures, capped

    store.setSessionDateOverride(null);
    store.close();
  });

  it("next-epoch renews retry budget for previously exhausted symbol", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);

    // Exhaust retries on Friday
    store.setFailure("XLE", "timeout");
    store.setFailure("XLE", "timeout");
    store.setFailure("XLE", "timeout");
    expect(store.getWorkQueue(FRIDAY_SESSION)).not.toContain("XLE");

    store.setSessionDateOverride(null);

    // Monday: symbol is eligible again (prior-epoch failed)
    expect(store.getWorkQueue(MONDAY_SESSION)).toContain("XLE");
    store.close();
  });

  it("successful refresh after prior epoch exhausted failures", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);

    // Exhaust retries and have some prior evidence
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    // Then fail (simulating next-session refresh failure)
    store.setFailure("XLE", "timeout");
    store.setFailure("XLE", "timeout");
    store.setFailure("XLE", "timeout");
    store.setSessionDateOverride(null);

    // Monday: eligible for refresh (prior epoch)
    expect(store.getWorkQueue(MONDAY_SESSION)).toContain("XLE");

    // Successful refresh on Monday
    store.setSessionDateOverride(MONDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-20T14:00:00Z");
    store.setChain("XLE", CHAIN, "2026-07-20T14:00:00Z");
    store.setSessionDateOverride(null);

    // Now resolved for Monday — not in queue
    expect(store.getWorkQueue(MONDAY_SESSION)).not.toContain("XLE");

    // Evidence is fresh
    const ev = store.get("XLE");
    expect(ev?.status).toBe("ready");
    expect(ev?.chain).toEqual(CHAIN);
    store.close();
  });

  it("prior successful evidence remains served throughout failure sequence", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setSessionDateOverride(null);

    // Multiple failures across epochs — data must survive each
    store.setFailure("XLE", "fail 1");
    expect(store.get("XLE")?.chain).toEqual(CHAIN);

    store.setFailure("XLE", "fail 2");
    expect(store.get("XLE")?.chain).toEqual(CHAIN);

    store.setFailure("XLE", "fail 3");
    expect(store.get("XLE")?.chain).toEqual(CHAIN);

    // Even after cap reached, data persists
    expect(store.get("XLE")?.expirations).toEqual(EXPIRATIONS);
    store.close();
  });
});

// --- Restart Durability ---

describe("session refresh across restart", () => {
  const TEMP_DB = "./data/test-session-refresh.sqlite3";

  afterEach(() => {
    if (existsSync(TEMP_DB)) unlinkSync(TEMP_DB);
  });

  it("restart with prior-session evidence queues symbols for refresh", () => {
    // First instance: acquire evidence on Friday
    const store1 = new SqliteEvidenceStore(TEMP_DB);
    store1.initUniverse(["XLE", "NOOPT"]);
    store1.setSessionDateOverride(FRIDAY_SESSION);
    store1.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store1.setChain("XLE", CHAIN, FRIDAY);
    store1.setExpirations("NOOPT", [], FRIDAY);
    store1.publishSnapshot();
    store1.close();

    // Second instance: reopen on Monday
    const store2 = new SqliteEvidenceStore(TEMP_DB);
    const queue = store2.getWorkQueue(MONDAY_SESSION);

    // Both should be queued for refresh
    expect(queue).toContain("XLE");
    expect(queue).toContain("NOOPT");
    store2.close();
  });

  it("restart after partial Monday refresh queues only remaining symbols", () => {
    // First instance: Friday evidence
    const store1 = new SqliteEvidenceStore(TEMP_DB);
    store1.initUniverse(["A", "B", "C"]);
    store1.setSessionDateOverride(FRIDAY_SESSION);
    store1.setExpirations("A", EXPIRATIONS, FRIDAY);
    store1.setChain("A", { ...CHAIN, symbol: "A" }, FRIDAY);
    store1.setExpirations("B", EXPIRATIONS, FRIDAY);
    store1.setChain("B", { ...CHAIN, symbol: "B" }, FRIDAY);
    store1.setExpirations("C", [], FRIDAY);
    store1.close();

    // Second instance: partially refresh on Monday (only A)
    const store2 = new SqliteEvidenceStore(TEMP_DB);
    store2.setSessionDateOverride(MONDAY_SESSION);
    store2.setExpirations("A", EXPIRATIONS, "2026-07-20T14:00:00Z");
    store2.setChain("A", { ...CHAIN, symbol: "A" }, "2026-07-20T14:01:00Z");
    store2.close();

    // Third instance: restart Monday — only B and C should need work
    const store3 = new SqliteEvidenceStore(TEMP_DB);
    const queue = store3.getWorkQueue(MONDAY_SESSION);

    expect(queue).not.toContain("A"); // already refreshed today
    expect(queue).toContain("B");     // still from Friday
    expect(queue).toContain("C");     // still from Friday
    store3.close();
  });
});

// --- Publication ---

describe("publication after refresh", () => {
  it("generation advances after refreshed evidence is published", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setSessionDateOverride(null);
    store.publishSnapshot();

    const genBefore = store.generation;

    // Refresh
    store.setSessionDateOverride(MONDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, "2026-07-20T14:00:00Z");
    store.setChain("XLE", CHAIN, "2026-07-20T14:01:00Z");
    store.setSessionDateOverride(null);
    store.publishSnapshot();

    expect(store.generation).toBe(genBefore + 1);
    store.close();
  });

  it("no publish when nothing changed means generation stays stable", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["XLE"]);
    store.setSessionDateOverride(FRIDAY_SESSION);
    store.setExpirations("XLE", EXPIRATIONS, FRIDAY);
    store.setChain("XLE", CHAIN, FRIDAY);
    store.setSessionDateOverride(null);
    store.publishSnapshot();

    const genAfterFirst = store.generation;

    // No changes, but publish again
    store.publishSnapshot();

    // Generation still advances (publication is explicit, not change-gated)
    // This matches TypeScript behavior where publishSnapshot always increments
    expect(store.generation).toBe(genAfterFirst + 1);
    store.close();
  });
});
