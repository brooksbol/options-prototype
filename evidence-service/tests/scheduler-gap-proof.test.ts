/**
 * Scheduler Gap Proof — Prior-epoch failed symbols.
 *
 * Demonstrates that getPrioritizedWorkQueue does NOT include prior-epoch
 * failed symbols, while getWorkQueue (legacy) does. This is a pre-existing
 * scheduler conformance gap unrelated to the telemetry fix.
 */

import { describe, it, expect } from "vitest";
import { SqliteEvidenceStore } from "../src/db/sqlite-evidence-store.js";
import type { MarketExpiration } from "../src/providers/tradier.js";

const EXPIRATIONS: MarketExpiration[] = [{ date: "2026-08-03", dte: 21 }];
const FRIDAY = "2026-07-18";
const MONDAY = "2026-07-21";

const CONFIG = {
  chainFreshnessTargetMs: 15 * 60 * 1000,
  chainMaxAgeMs: 120 * 60 * 1000,
  expirationFreshnessMs: 6 * 60 * 60 * 1000,
};

describe("scheduler gap — prior-epoch failed symbols", () => {
  it("legacy getWorkQueue includes prior-epoch failed (retry budget renews)", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["FAIL"]);
    store.setSessionDateOverride(FRIDAY);
    store.setExpirations("FAIL", EXPIRATIONS, "2026-07-18T14:00:00Z");
    store.setFailure("FAIL", "timeout");
    store.setFailure("FAIL", "timeout");
    store.setFailure("FAIL", "timeout"); // exhausted in Friday epoch
    store.setSessionDateOverride(null);

    // Legacy queue on Monday: symbol IS present (prior-epoch clause)
    const legacyQueue = store.getWorkQueue(MONDAY);
    expect(legacyQueue).toContain("FAIL");

    store.close();
  });

  it("getPrioritizedWorkQueue does NOT include prior-epoch failed (gap)", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["FAIL"]);
    store.setSessionDateOverride(FRIDAY);
    store.setExpirations("FAIL", EXPIRATIONS, "2026-07-18T14:00:00Z");
    store.setFailure("FAIL", "timeout");
    store.setFailure("FAIL", "timeout");
    store.setFailure("FAIL", "timeout");
    store.setSessionDateOverride(null);

    // Tiered queue on Monday: symbol is ABSENT
    const tieredQueue = store.getPrioritizedWorkQueue({
      ...CONFIG,
      currentSessionDate: MONDAY,
    });
    const item = tieredQueue.find(i => i.symbol === "FAIL");

    // This assertion documents the gap: the tiered scheduler loses these symbols
    expect(item).toBeUndefined();

    store.close();
  });

  it("getClassifiedPopulation counts prior-epoch failed as Class C", () => {
    const store = new SqliteEvidenceStore(":memory:");
    store.initUniverse(["FAIL"]);
    store.setSessionDateOverride(FRIDAY);
    store.setExpirations("FAIL", EXPIRATIONS, "2026-07-18T14:00:00Z");
    store.setFailure("FAIL", "timeout");
    store.setFailure("FAIL", "timeout");
    store.setFailure("FAIL", "timeout");
    store.setSessionDateOverride(null);

    const pop = store.getClassifiedPopulation({ currentSessionDate: MONDAY });

    // Telemetry reports it as eligible Class C
    expect(pop.classC).toBe(1);

    // But the tiered scheduler won't actually execute it
    const tieredQueue = store.getPrioritizedWorkQueue({
      ...CONFIG,
      currentSessionDate: MONDAY,
    });
    expect(tieredQueue.filter(i => i.symbol === "FAIL").length).toBe(0);

    // This means eligible.classC > due.classC for a reason OTHER than freshness:
    // the symbol is classified but has no execution path in the tiered scheduler.

    store.close();
  });
});
