/**
 * Tests for scan audit record creation.
 */

import { describe, it, expect } from "vitest";
import { createScanAuditRecord } from "../../src/write-desk/scan-audit";
import { createDemoSnapshot } from "../../src/write-desk/demo-snapshot";
import type { PutCandidate, CallCandidate, CallInventoryItem } from "../../src/write-desk/scan-orchestrator";

function makePutCandidate(overrides?: Partial<PutCandidate>): PutCandidate {
  return {
    rank: 1,
    symbol: "XLE",
    expiration: "2026-08-14",
    dte: 31,
    strike: 85,
    delta: -0.30,
    bid: 1.50,
    ask: 1.70,
    mid: 1.60,
    spreadPercent: 12,
    openInterest: 500,
    volume: 100,
    cashRequired: 8500,
    cashRemaining: 10000,
    yieldAnnualized: 22.5,
    assessment: { score: 82, posture: "ACTIONABLE", components: [], hardNoReason: null, policyVersion: "v1-provisional" },
    posture: "ACTIONABLE",
    ...overrides,
  };
}

describe("createScanAuditRecord", () => {
  it("captures portfolio provenance", () => {
    const snapshot = createDemoSnapshot();
    const record = createScanAuditRecord(
      snapshot,
      [makePutCandidate()],
      [{ symbol: "SOXS", reason: "Structurally complex" }],
      [],
      [],
      [],
      "tradier",
      { version: "v1-provisional", targetDelta: 0.30, dteRange: { min: 7, max: 45 } }
    );

    expect(record.portfolioSourceType).toBe("demo");
    expect(record.portfolioSnapshotId).toBe("demo-portfolio-v1");
    expect(record.accountId).toBe("DEMO-001");
    expect(record.deployableCash).toBe(18500);
  });

  it("captures market context", () => {
    const snapshot = createDemoSnapshot();
    const record = createScanAuditRecord(snapshot, [], [], [], [], [], "tradier",
      { version: "v1-provisional", targetDelta: 0.30, dteRange: { min: 7, max: 45 } });

    expect(record.marketProvider).toBe("tradier");
    expect(record.delayedData).toBe(true);
    expect(record.route).toBe("/app/write");
  });

  it("counts posture categories correctly", () => {
    const snapshot = createDemoSnapshot();
    const candidates = [
      makePutCandidate({ posture: "ACTIONABLE" }),
      makePutCandidate({ symbol: "XLF", posture: "EDGE" }),
      makePutCandidate({ symbol: "XLU", posture: "WAIT" }),
    ];
    const record = createScanAuditRecord(snapshot, candidates, [], [], [], [], "mock",
      { version: "v1-provisional", targetDelta: 0.30, dteRange: { min: 7, max: 45 } });

    expect(record.actionableCount).toBe(1);
    expect(record.edgeCount).toBe(1);
    expect(record.waitCount).toBe(1);
    expect(record.totalCandidates).toBe(3);
  });

  it("preserves excluded symbols", () => {
    const snapshot = createDemoSnapshot();
    const excluded = [
      { symbol: "SOXS", reason: "Structurally complex" },
      { symbol: "SPY", reason: "Capital exceeds budget" },
    ];
    const record = createScanAuditRecord(snapshot, [], excluded, [], [], [], "mock",
      { version: "v1-provisional", targetDelta: 0.30, dteRange: { min: 7, max: 45 } });

    expect(record.putExcluded.length).toBe(2);
    expect(record.putExcluded[0].symbol).toBe("SOXS");
  });

  it("is JSON-serializable (audit persistence)", () => {
    const snapshot = createDemoSnapshot();
    const record = createScanAuditRecord(snapshot, [makePutCandidate()], [], [], [], [], "tradier",
      { version: "v1-provisional", targetDelta: 0.30, dteRange: { min: 7, max: 45 } });

    const json = JSON.stringify(record);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe(record.id);
    expect(parsed.putCandidates.length).toBe(1);
    expect(parsed.scanConfigVersion).toBe("v1-provisional");
  });

  it("records scan config version for policy traceability", () => {
    const snapshot = createDemoSnapshot();
    const record = createScanAuditRecord(snapshot, [], [], [], [], [], "mock",
      { version: "v1-provisional", targetDelta: 0.30, dteRange: { min: 7, max: 45 } });

    expect(record.scanConfigVersion).toBe("v1-provisional");
    expect(record.targetDelta).toBe(0.30);
    expect(record.dteRange).toEqual({ min: 7, max: 45 });
  });
});
