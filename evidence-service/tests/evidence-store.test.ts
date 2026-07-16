/**
 * Tests for the in-memory EvidenceStore.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { EvidenceStore } from "../src/evidence-store.js";

describe("EvidenceStore", () => {
  let store: EvidenceStore;

  beforeEach(() => {
    store = new EvidenceStore();
  });

  it("initializes symbols as pending", () => {
    store.initUniverse(["XLE", "QQQ", "SPY"]);
    const cov = store.getCoverage();
    expect(cov.pending).toBe(3);
    expect(cov.ready).toBe(0);
  });

  it("setExpirations moves symbol to expirations_known", () => {
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", [{ date: "2026-08-21", dte: 37 }], "2026-07-16T10:00:00Z");
    const ev = store.get("XLE");
    expect(ev?.status).toBe("expirations_known");
    expect(ev?.primaryExpiration).toBe("2026-08-21");
  });

  it("setExpirations with empty array → absent", () => {
    store.initUniverse(["AAVM"]);
    store.setExpirations("AAVM", [], "2026-07-16T10:00:00Z");
    expect(store.get("AAVM")?.status).toBe("absent");
    expect(store.getCoverage().absent).toBe(1);
  });

  it("setChain moves symbol to ready", () => {
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", [{ date: "2026-08-21", dte: 37 }], "now");
    store.setChain("XLE", { symbol: "XLE", expiration: "2026-08-21", underlying: { symbol: "XLE", name: "Energy", price: 88 }, puts: [], calls: [] }, "now");
    expect(store.get("XLE")?.status).toBe("ready");
    expect(store.getCoverage().ready).toBe(1);
  });

  it("generation advances on each change", () => {
    store.initUniverse(["A", "B"]);
    const g0 = store.generation;
    store.setExpirations("A", [{ date: "2026-08-21", dte: 37 }], "now");
    expect(store.generation).toBe(g0 + 1);
    store.setExpirations("B", [], "now");
    expect(store.generation).toBe(g0 + 2);
  });

  it("ETag changes with generation", () => {
    store.initUniverse(["XLE"]);
    const etag1 = store.getETag();
    store.setExpirations("XLE", [{ date: "2026-08-21", dte: 37 }], "now");
    const etag2 = store.getETag();
    expect(etag2).not.toBe(etag1);
  });

  it("getWorkQueue returns pending and expirations_known symbols", () => {
    store.initUniverse(["A", "B", "C"]);
    store.setExpirations("A", [{ date: "2026-08-21", dte: 37 }], "now"); // expirations_known
    store.setExpirations("B", [], "now"); // absent
    // C is still pending
    const work = store.getWorkQueue();
    expect(work).toContain("A"); // needs chain
    expect(work).toContain("C"); // needs expirations
    expect(work).not.toContain("B"); // absent — done
  });

  it("setFailure increments failure count", () => {
    store.initUniverse(["XLE"]);
    store.setFailure("XLE", "timeout");
    expect(store.get("XLE")?.failureCount).toBe(1);
    expect(store.get("XLE")?.status).toBe("pending"); // not yet "failed"
    store.setFailure("XLE", "timeout");
    store.setFailure("XLE", "timeout");
    expect(store.get("XLE")?.status).toBe("failed"); // 3 failures
  });

  it("buildSnapshot includes all symbols", () => {
    store.initUniverse(["A", "B"]);
    store.setExpirations("A", [], "now");
    const snap = store.buildSnapshot();
    expect(snap.universe).toBe(2);
    expect(snap.symbols).toHaveLength(2);
    expect(snap.coverage.absent).toBe(1);
    expect(snap.coverage.pending).toBe(1);
  });

  it("selectPrimaryExpiration picks nearest to 21 DTE", () => {
    store.initUniverse(["XLE"]);
    store.setExpirations("XLE", [
      { date: "2026-07-24", dte: 8 },
      { date: "2026-08-07", dte: 22 },
      { date: "2026-08-21", dte: 36 },
    ], "now");
    expect(store.get("XLE")?.primaryExpiration).toBe("2026-08-07"); // 22 DTE closest to 21
  });
});
