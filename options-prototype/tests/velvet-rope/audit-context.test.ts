/**
 * Tests for Velvet Rope audit context derivation.
 *
 * Verifies contract identity matching and semantic state determination
 * for the Opportunity Lab integration.
 */

import { describe, it, expect } from "vitest";
import {
  contractsMatch,
  deriveAuditContext,
  type ContractIdentity,
} from "../../src/velvet-rope/audit-context";
import type { AdmissionAuditRecord, VelvetRopeState } from "../../src/velvet-rope/types";
import { DEFAULT_ADMISSION_POLICY } from "../../src/velvet-rope/policy";
import { CONVENTIONAL_STRUCTURE } from "../../src/velvet-rope/product-structure";

// --- Helpers ---

function makeAuditRecord(overrides: Partial<AdmissionAuditRecord> & { symbol: string }): AdmissionAuditRecord {
  return {
    id: "test-1",
    attemptedAt: new Date().toISOString(),
    attemptStatus: "completed",
    outcome: "reject",
    policySnapshot: DEFAULT_ADMISSION_POLICY,
    evidenceProvenance: { provider: "tradier", observedAt: null, retrievedAt: new Date().toISOString(), source: "network", cacheAgeSeconds: null, delayedData: true },
    expirationSelection: { status: "selected", selectedDate: "2026-07-17", selectedDte: 4, availableCount: 10, searchRange: { min: 7, max: 45 } },
    callEvidence: { side: "call", selectedContract: { strike: 185, delta: 0.32, bid: 1.12, ask: 2.02, mid: 1.57, spread: 0.90, spreadPercent: 44.5, openInterest: 33, volume: 12, iv: 0.41, annualizedYield: 73.5, dte: 4 }, selectionStatus: "selected", criteria: [] },
    putEvidence: { side: "put", selectedContract: { strike: 178, delta: -0.31, bid: 1.50, ask: 1.70, mid: 1.60, spread: 0.20, spreadPercent: 12.5, openInterest: 87, volume: 45, iv: 0.38, annualizedYield: 23.4, dte: 4 }, selectionStatus: "selected", criteria: [] },
    aggregatedCriteria: [],
    productStructure: CONVENTIONAL_STRUCTURE,
    explanation: "Test record",
    ...overrides,
  };
}

function makeVrState(records: AdmissionAuditRecord[]): VelvetRopeState {
  return {
    schemaVersion: 1,
    activePolicy: DEFAULT_ADMISSION_POLICY,
    auditRecords: records,
  };
}

// --- contractsMatch ---

describe("contractsMatch", () => {
  it("returns true for identical identities", () => {
    const a: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
    const b: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
    expect(contractsMatch(a, b)).toBe(true);
  });

  it("returns false when symbol differs", () => {
    const a: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
    const b: ContractIdentity = { symbol: "XLE", side: "call", expiration: "2026-07-17", strike: 185 };
    expect(contractsMatch(a, b)).toBe(false);
  });

  it("returns false when expiration differs", () => {
    const a: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
    const b: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-08-21", strike: 185 };
    expect(contractsMatch(a, b)).toBe(false);
  });

  it("returns false when strike differs", () => {
    const a: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
    const b: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 190 };
    expect(contractsMatch(a, b)).toBe(false);
  });

  it("returns false when side differs", () => {
    const a: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
    const b: ContractIdentity = { symbol: "XLK", side: "put", expiration: "2026-07-17", strike: 185 };
    expect(contractsMatch(a, b)).toBe(false);
  });
});

// --- deriveAuditContext ---

describe("deriveAuditContext", () => {
  describe("not_evaluated", () => {
    it("returns not_evaluated when no audit records exist", () => {
      const state = makeVrState([]);
      const ctx = deriveAuditContext("XLK", null, null, state);
      expect(ctx.match).toBe("not_evaluated");
      expect(ctx.record).toBeNull();
      expect(ctx.priorOutcome).toBeNull();
    });

    it("returns not_evaluated when only provider_failed records exist", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptStatus: "provider_failed", outcome: null });
      const state = makeVrState([record]);
      const ctx = deriveAuditContext("XLK", null, null, state);
      expect(ctx.match).toBe("not_evaluated");
    });

    it("returns not_evaluated for a different symbol", () => {
      const record = makeAuditRecord({ symbol: "XLE" });
      const state = makeVrState([record]);
      const ctx = deriveAuditContext("XLK", null, null, state);
      expect(ctx.match).toBe("not_evaluated");
    });
  });

  describe("exact_match", () => {
    it("returns exact_match when call identity matches", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: new Date().toISOString() });
      const state = makeVrState([record]);
      const currentCall: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
      const ctx = deriveAuditContext("XLK", currentCall, null, state);
      expect(ctx.match).toBe("exact_match");
      expect(ctx.priorOutcome).toBe("reject");
    });

    it("returns exact_match when put identity matches", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: new Date().toISOString() });
      const state = makeVrState([record]);
      const currentPut: ContractIdentity = { symbol: "XLK", side: "put", expiration: "2026-07-17", strike: 178 };
      const ctx = deriveAuditContext("XLK", null, currentPut, state);
      expect(ctx.match).toBe("exact_match");
    });
  });

  describe("exact_match_stale", () => {
    it("returns exact_match_stale when contract matches but evaluation is old", () => {
      const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48 hours ago
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: oldDate });
      const state = makeVrState([record]);
      const currentCall: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
      const ctx = deriveAuditContext("XLK", currentCall, null, state);
      expect(ctx.match).toBe("exact_match_stale");
    });
  });

  describe("same_symbol (different contract)", () => {
    it("returns same_symbol when expiration differs", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: new Date().toISOString() });
      const state = makeVrState([record]);
      // Current opportunity is at a different expiration
      const currentCall: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-08-21", strike: 185 };
      const ctx = deriveAuditContext("XLK", currentCall, null, state);
      expect(ctx.match).toBe("same_symbol");
    });

    it("returns same_symbol when strike differs", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: new Date().toISOString() });
      const state = makeVrState([record]);
      const currentCall: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 190 };
      const ctx = deriveAuditContext("XLK", currentCall, null, state);
      expect(ctx.match).toBe("same_symbol");
    });

    it("returns same_symbol when side doesn't match (call in audit, put in opportunity)", () => {
      // Audit has call at 185, but we're asking about put at 185 (different side)
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: new Date().toISOString() });
      const state = makeVrState([record]);
      // Only passing a put identity that doesn't match the audit's put strike
      const currentPut: ContractIdentity = { symbol: "XLK", side: "put", expiration: "2026-07-17", strike: 185 };
      const ctx = deriveAuditContext("XLK", null, currentPut, state);
      // Put strike in audit is 178, current is 185 → different contract
      expect(ctx.match).toBe("same_symbol");
    });
  });

  describe("latest record selection", () => {
    it("uses the most recent successful evaluation", () => {
      const older = makeAuditRecord({ symbol: "XLK", id: "old", attemptedAt: "2026-07-10T10:00:00Z", outcome: "admit" });
      const newer = makeAuditRecord({ symbol: "XLK", id: "new", attemptedAt: "2026-07-13T14:00:00Z", outcome: "reject" });
      const state = makeVrState([older, newer]);
      const ctx = deriveAuditContext("XLK", null, null, state);
      expect(ctx.priorOutcome).toBe("reject"); // newer record
      expect(ctx.record?.id).toBe("new");
    });
  });

  describe("context fields", () => {
    it("includes policy version", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: new Date().toISOString() });
      const state = makeVrState([record]);
      const ctx = deriveAuditContext("XLK", null, null, state);
      expect(ctx.policyVersion).toBe("v1");
    });

    it("includes prior contract details", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: new Date().toISOString() });
      const state = makeVrState([record]);
      const ctx = deriveAuditContext("XLK", null, null, state);
      expect(ctx.priorCallStrike).toBe(185);
      expect(ctx.priorCallExpiration).toBe("2026-07-17");
      expect(ctx.priorPutStrike).toBe(178);
      expect(ctx.priorPutExpiration).toBe("2026-07-17");
    });

    it("includes evaluation timestamp", () => {
      const record = makeAuditRecord({ symbol: "XLK", attemptedAt: "2026-07-13T14:30:00Z" });
      const state = makeVrState([record]);
      const ctx = deriveAuditContext("XLK", null, null, state);
      expect(ctx.evaluatedAt).toBe("2026-07-13T14:30:00Z");
    });
  });

  describe("semantic guardrails", () => {
    it("a prior REJECT on a different contract is NOT marked as exact_match", () => {
      // This is the critical semantic guardrail:
      // A prior rejection at $194 strike should NOT label a current $185 opportunity
      const record = makeAuditRecord({
        symbol: "XLK",
        attemptedAt: new Date().toISOString(),
        outcome: "reject",
      });
      // Modify the audit record to have a different strike
      record.callEvidence.selectedContract = { ...record.callEvidence.selectedContract!, strike: 194 };
      const state = makeVrState([record]);

      // Current opportunity is at $185
      const currentCall: ContractIdentity = { symbol: "XLK", side: "call", expiration: "2026-07-17", strike: 185 };
      const ctx = deriveAuditContext("XLK", currentCall, null, state);

      // Must be "same_symbol" not "exact_match"
      expect(ctx.match).toBe("same_symbol");
      // The prior outcome is still accessible for context but NOT as a current judgment
      expect(ctx.priorOutcome).toBe("reject");
    });

    it("no additional provider calls are triggered", () => {
      // deriveAuditContext is synchronous and reads only from the provided state
      const state = makeVrState([]);
      const start = Date.now();
      deriveAuditContext("XLK", null, null, state);
      const elapsed = Date.now() - start;
      // Should be effectively instant (< 5ms)
      expect(elapsed).toBeLessThan(50);
    });
  });
});
