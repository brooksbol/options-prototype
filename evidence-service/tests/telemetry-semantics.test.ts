/**
 * Telemetry Semantics Tests — eligible vs due divergence.
 *
 * Proves:
 * 1. Fresh Class A symbol: counted in eligible.classA, NOT in due.classA
 * 2. Stale Class A symbol: counted in BOTH eligible.classA and due.classA
 * 3. Fresh Class B symbol: counted in eligible.classB, NOT in due.classB
 * 4. Stale Class B symbol: counted in BOTH eligible.classB and due.classB
 * 5. Class C uses same predicates as scheduler (pending, partial, retriable failed, prior-epoch failed)
 * 6. Class D uses same predicates as scheduler (prior-epoch absent)
 * 7. eligible and due explicitly diverge
 * 8. Current-session absent symbols are excluded from both eligible and due
 * 9. Current-epoch retry-exhausted failed symbols are excluded from both eligible and due
 * 10. Prior-epoch failed symbols are counted in eligible.classC
 */

import { describe, it, expect } from "vitest";
import { SqliteEvidenceStore } from "../src/db/sqlite-evidence-store.js";
import type { MarketExpiration, MarketChain } from "../src/providers/tradier.js";

// --- Fixtures ---

const EXPIRATIONS: MarketExpiration[] = [
  { date: "2026-08-03", dte: 21 },
];

/** Chain with qualifying puts (Class A) */
const QUALIFYING_CHAIN: MarketChain = {
  symbol: "XLE",
  expiration: "2026-08-03",
  underlying: { symbol: "XLE", name: "Energy Select Sector", price: 58.0 },
  puts: [{ strike: 55, bid: 1.50, ask: 1.70, delta: -0.28, openInterest: 520, volume: 110 }],
  calls: [{ strike: 60, bid: 1.20, ask: 1.40, delta: 0.32, openInterest: 300, volume: 80 }],
};

/** Chain with NO qualifying puts (Class B) */
const NONQUALIFYING_CHAIN: MarketChain = {
  symbol: "OBSCURE",
  expiration: "2026-08-03",
  underlying: { symbol: "OBSCURE", name: "Obscure ETF", price: 10.0 },
  puts: [{ strike: 9, bid: 0, ask: 0.05, delta: -0.10, openInterest: 0, volume: 0 }],
  calls: [],
};

const CONFIG_15MIN = {
  chainFreshnessTargetMs: 15 * 60 * 1000,
  chainMaxAgeMs: 120 * 60 * 1000,
  expirationFreshnessMs: 6 * 60 * 60 * 1000,
};

const SESSION_DATE = "2026-07-21";
const PRIOR_SESSION_DATE = "2026-07-18";

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// --- Class A: eligible vs due ---

describe("telemetry semantics — Class A", () => {
  it("fresh Class A symbol is in eligible.classA but NOT in due.classA", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(5));
    store.setChain("XLE", QUALIFYING_CHAIN, minutesAgo(5)); // 5 min < 15 min target

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    expect(population.classA).toBe(1);
    expect(workQueue.filter(i => i.urgencyClass === "A").length).toBe(0);

    store.close();
  });

  it("stale Class A symbol is in BOTH eligible.classA and due.classA", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", EXPIRATIONS, minutesAgo(20));
    store.setChain("XLE", QUALIFYING_CHAIN, minutesAgo(20)); // 20 min > 15 min target

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    expect(population.classA).toBe(1);
    expect(workQueue.filter(i => i.urgencyClass === "A").length).toBe(1);

    store.close();
  });
});

// --- Class B: eligible vs due ---

describe("telemetry semantics — Class B", () => {
  it("fresh Class B symbol is in eligible.classB but NOT in due.classB", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["OBSCURE"]);
    store.setExpirations("OBSCURE", EXPIRATIONS, minutesAgo(60));
    store.setChain("OBSCURE", NONQUALIFYING_CHAIN, minutesAgo(60)); // 60 min < 120 min max

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    expect(population.classB).toBe(1);
    expect(workQueue.filter(i => i.urgencyClass === "B").length).toBe(0);

    store.close();
  });

  it("stale Class B symbol is in BOTH eligible.classB and due.classB", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["OBSCURE"]);
    store.setExpirations("OBSCURE", EXPIRATIONS, hoursAgo(3));
    store.setChain("OBSCURE", NONQUALIFYING_CHAIN, hoursAgo(3)); // 180 min > 120 min max

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    expect(population.classB).toBe(1);
    expect(workQueue.filter(i => i.urgencyClass === "B").length).toBe(1);

    store.close();
  });
});

// --- Class C: same predicates as scheduler ---

describe("telemetry semantics — Class C", () => {
  it("pending symbol counted in eligible.classC", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["NEW"]);

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    expect(population.classC).toBe(1);
    expect(workQueue.filter(i => i.urgencyClass === "C").length).toBe(1);

    store.close();
  });

  it("current-epoch failed symbol with retries remaining is in eligible.classC", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["FAIL1"]);
    store.setExpirations("FAIL1", EXPIRATIONS, minutesAgo(10));
    // Simulate failure (less than 3 retries)
    store.setFailure("FAIL1", "timeout");

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    expect(population.classC).toBe(1);
    expect(workQueue.filter(i => i.urgencyClass === "C").length).toBe(1);

    store.close();
  });

  it("prior-epoch failed symbol counted in eligible.classC", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(PRIOR_SESSION_DATE);
    store.initUniverse(["OLDFAIL"]);
    store.setExpirations("OLDFAIL", EXPIRATIONS, "2026-07-18T14:00:00Z");
    store.setFailure("OLDFAIL", "provider error");
    store.setFailure("OLDFAIL", "provider error");
    store.setFailure("OLDFAIL", "provider error"); // exhausted in prior epoch
    store.setSessionDateOverride(null);

    // In a new epoch, retry budget renews — symbol should be Class C
    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });

    expect(population.classC).toBe(1);
    expect(population.classA).toBe(0);
    expect(population.classB).toBe(0);
    expect(population.classD).toBe(0);

    store.close();
  });
});

// --- Class D: same predicates as scheduler ---

describe("telemetry semantics — Class D", () => {
  it("prior-epoch absent symbol counted in eligible.classD", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(PRIOR_SESSION_DATE);
    store.initUniverse(["NOOPT"]);
    store.setExpirations("NOOPT", [], "2026-07-18T14:00:00Z"); // absent
    store.setSessionDateOverride(null);

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    expect(population.classD).toBe(1);
    expect(workQueue.filter(i => i.urgencyClass === "D").length).toBe(1);

    store.close();
  });

  it("Class D uses same predicate as scheduler work queue", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(PRIOR_SESSION_DATE);
    store.initUniverse(["D1", "D2", "D3"]);
    store.setExpirations("D1", [], "2026-07-18T14:00:00Z");
    store.setExpirations("D2", [], "2026-07-18T14:00:00Z");
    store.setExpirations("D3", [], "2026-07-18T14:00:00Z");
    store.setSessionDateOverride(null);

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    // All three are Class D in both eligible and due
    expect(population.classD).toBe(3);
    expect(workQueue.filter(i => i.urgencyClass === "D").length).toBe(3);

    store.close();
  });
});

// --- Divergence proof ---

describe("telemetry semantics — divergence", () => {
  it("eligible and due explicitly diverge when fresh symbols exist", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["FRESH_A", "STALE_A", "FRESH_B", "STALE_B", "PENDING"]);

    // Fresh Class A (eligible but not due)
    store.setExpirations("FRESH_A", EXPIRATIONS, minutesAgo(5));
    store.setChain("FRESH_A", { ...QUALIFYING_CHAIN, symbol: "FRESH_A" }, minutesAgo(5));

    // Stale Class A (eligible AND due)
    store.setExpirations("STALE_A", EXPIRATIONS, minutesAgo(20));
    store.setChain("STALE_A", { ...QUALIFYING_CHAIN, symbol: "STALE_A" }, minutesAgo(20));

    // Fresh Class B (eligible but not due)
    store.setExpirations("FRESH_B", EXPIRATIONS, minutesAgo(60));
    store.setChain("FRESH_B", { ...NONQUALIFYING_CHAIN, symbol: "FRESH_B" }, minutesAgo(60));

    // Stale Class B (eligible AND due)
    store.setExpirations("STALE_B", EXPIRATIONS, hoursAgo(3));
    store.setChain("STALE_B", { ...NONQUALIFYING_CHAIN, symbol: "STALE_B" }, hoursAgo(3));

    // Pending (Class C: eligible AND due)
    // PENDING is already pending from initUniverse

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });
    const due = {
      classA: workQueue.filter(i => i.urgencyClass === "A").length,
      classB: workQueue.filter(i => i.urgencyClass === "B").length,
      classC: workQueue.filter(i => i.urgencyClass === "C").length,
      classD: workQueue.filter(i => i.urgencyClass === "D").length,
    };

    // Eligible counts ALL classified symbols
    expect(population.classA).toBe(2); // FRESH_A + STALE_A
    expect(population.classB).toBe(2); // FRESH_B + STALE_B
    expect(population.classC).toBe(1); // PENDING
    expect(population.classD).toBe(0);

    // Due counts only actionable work
    expect(due.classA).toBe(1); // only STALE_A
    expect(due.classB).toBe(1); // only STALE_B
    expect(due.classC).toBe(1); // PENDING (always due)
    expect(due.classD).toBe(0);

    // The key assertion: eligible > due for A and B
    expect(population.classA).toBeGreaterThan(due.classA);
    expect(population.classB).toBeGreaterThan(due.classB);

    store.close();
  });
});

// --- Completeness boundary: intentional exclusions ---

describe("telemetry semantics — excluded populations", () => {
  it("current-session absent symbol is excluded from eligible and due", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["ABSENT_TODAY"]);
    store.setExpirations("ABSENT_TODAY", [], minutesAgo(30)); // confirmed absent this session

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    // Should not appear anywhere — terminal this epoch
    expect(population.classA).toBe(0);
    expect(population.classB).toBe(0);
    expect(population.classC).toBe(0);
    expect(population.classD).toBe(0);
    expect(workQueue.length).toBe(0);

    store.close();
  });

  it("current-epoch retry-exhausted failed symbol is excluded from eligible and due", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    store.initUniverse(["EXHAUSTED"]);
    store.setExpirations("EXHAUSTED", EXPIRATIONS, minutesAgo(30));
    // Exhaust retries (3 failures in current epoch)
    store.setFailure("EXHAUSTED", "error 1");
    store.setFailure("EXHAUSTED", "error 2");
    store.setFailure("EXHAUSTED", "error 3");

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });
    const workQueue = store.getPrioritizedWorkQueue({ ...CONFIG_15MIN, currentSessionDate: SESSION_DATE });

    // Should not appear in eligible or due — retry budget exhausted
    expect(population.classA).toBe(0);
    expect(population.classB).toBe(0);
    expect(population.classC).toBe(0);
    expect(population.classD).toBe(0);
    expect(workQueue.filter(i => i.symbol === "EXHAUSTED").length).toBe(0);

    store.close();
  });

  it("sum of eligible classes equals classified population (excludes terminal symbols)", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.setSessionDateOverride(SESSION_DATE);
    // Mix of everything
    store.initUniverse(["A1", "B1", "PENDING", "ABSENT_PRIOR", "ABSENT_CURRENT", "EXHAUSTED"]);

    // A1: ready, qualifying
    store.setExpirations("A1", EXPIRATIONS, minutesAgo(5));
    store.setChain("A1", { ...QUALIFYING_CHAIN, symbol: "A1" }, minutesAgo(5));

    // B1: ready, non-qualifying
    store.setExpirations("B1", EXPIRATIONS, minutesAgo(60));
    store.setChain("B1", { ...NONQUALIFYING_CHAIN, symbol: "B1" }, minutesAgo(60));

    // PENDING: lifecycle
    // (no further action — stays pending)

    // ABSENT_PRIOR: prior-epoch absent → Class D
    store.setSessionDateOverride(PRIOR_SESSION_DATE);
    store.setExpirations("ABSENT_PRIOR", [], "2026-07-18T10:00:00Z");
    store.setSessionDateOverride(SESSION_DATE);

    // ABSENT_CURRENT: current-epoch absent → excluded
    store.setExpirations("ABSENT_CURRENT", [], minutesAgo(30));

    // EXHAUSTED: retry-exhausted → excluded
    store.setExpirations("EXHAUSTED", EXPIRATIONS, minutesAgo(30));
    store.setFailure("EXHAUSTED", "e1");
    store.setFailure("EXHAUSTED", "e2");
    store.setFailure("EXHAUSTED", "e3");

    const population = store.getClassifiedPopulation({ currentSessionDate: SESSION_DATE });

    // Classified population: A1 + B1 + PENDING + ABSENT_PRIOR = 4
    const totalClassified = population.classA + population.classB + population.classC + population.classD;
    expect(totalClassified).toBe(4);

    // Verify each class
    expect(population.classA).toBe(1); // A1
    expect(population.classB).toBe(1); // B1
    expect(population.classC).toBe(1); // PENDING
    expect(population.classD).toBe(1); // ABSENT_PRIOR

    // Excluded: ABSENT_CURRENT, EXHAUSTED
    // Total universe = 6, classified = 4, excluded = 2

    store.close();
  });
});
