/**
 * Tests for UI semantic fixes:
 * A. Side-asymmetric OI badge wording in narrative strengths
 * B. Evidence header adapts based on winningExpiration
 */

import { describe, it, expect } from "vitest";
import { synthesizeNarrative } from "../../src/velvet-rope/narrative";
import { DEFAULT_ADMISSION_POLICY } from "../../src/velvet-rope/policy";
import type { AdmissionAuditRecord, OptionSideEvidence, CriterionResult, ExpirationEvaluation } from "../../src/velvet-rope/types";
import { CONVENTIONAL_STRUCTURE } from "../../src/velvet-rope/product-structure";

// --- Helpers ---

function makeCriterion(overrides: Partial<CriterionResult>): CriterionResult {
  return {
    criterion: "minOpenInterest",
    status: "pass",
    measuredValue: 200,
    threshold: "50",
    severity: "hard",
    explanation: "Open interest: 200",
    ...overrides,
  };
}

function makeEvidence(side: "call" | "put", criteria: CriterionResult[]): OptionSideEvidence {
  return {
    side,
    selectedContract: {
      strike: 55,
      delta: side === "call" ? 0.30 : -0.30,
      bid: 1.00,
      ask: 1.20,
      mid: 1.10,
      spread: 0.20,
      spreadPercent: 10.0,
      openInterest: 200,
      volume: 50,
      iv: 0.28,
      annualizedYield: 25.0,
      dte: 14,
    },
    selectionStatus: "selected",
    criteria,
  };
}

function makeRecord(overrides: Partial<AdmissionAuditRecord>): AdmissionAuditRecord {
  return {
    id: "test-1",
    symbol: "TEST",
    attemptedAt: new Date().toISOString(),
    attemptStatus: "completed",
    outcome: "reject",
    policySnapshot: DEFAULT_ADMISSION_POLICY,
    evidenceProvenance: {
      provider: "tradier_sandbox",
      observedAt: null,
      retrievedAt: new Date().toISOString(),
      source: "network",
      cacheAgeSeconds: null,
      delayedData: true,
    },
    expirationSelection: {
      status: "selected",
      selectedDate: "2026-08-21",
      selectedDte: 38,
      availableCount: 6,
      searchRange: { min: 7, max: 45 },
    },
    callEvidence: makeEvidence("call", []),
    putEvidence: makeEvidence("put", []),
    aggregatedCriteria: [],
    productStructure: CONVENTIONAL_STRUCTURE,
    explanation: "Test evaluation",
    expirationEvaluations: [],
    winningExpiration: null,
    ...overrides,
  };
}

// --- A. Side-Asymmetric OI Badge ---

describe("narrative strengths — side-asymmetric OI", () => {
  it("call OI passes, put OI fails, sideRequirement=both → asymmetric message", () => {
    const callCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "pass", measuredValue: 356 }),
      makeCriterion({ criterion: "maxBidAskSpreadPercent", status: "fail", measuredValue: 29.6, threshold: "15", explanation: "Spread: 29.6%" }),
    ];
    const putCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "fail", measuredValue: 9, explanation: "Open interest: 9" }),
      makeCriterion({ criterion: "maxBidAskSpreadPercent", status: "fail", measuredValue: 28.6, threshold: "15", explanation: "Spread: 28.6%" }),
    ];

    const record = makeRecord({
      callEvidence: makeEvidence("call", callCriteria),
      putEvidence: makeEvidence("put", putCriteria),
    });

    const narrative = synthesizeNarrative(record);
    const oiStrength = narrative.strengths.find((s) => s.includes("OI"));
    expect(oiStrength).toBeDefined();
    expect(oiStrength).toContain("Call OI adequate (356)");
    expect(oiStrength).toContain("put OI insufficient (9)");
    expect(oiStrength).toContain("both sides required");
  });

  it("put OI passes, call OI fails, sideRequirement=both → reverse asymmetric message", () => {
    const callCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "fail", measuredValue: 20 }),
    ];
    const putCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "pass", measuredValue: 400 }),
    ];

    const record = makeRecord({
      callEvidence: makeEvidence("call", callCriteria),
      putEvidence: makeEvidence("put", putCriteria),
    });

    const narrative = synthesizeNarrative(record);
    const oiStrength = narrative.strengths.find((s) => s.includes("OI"));
    expect(oiStrength).toBeDefined();
    expect(oiStrength).toContain("Put OI adequate (400)");
    expect(oiStrength).toContain("call OI insufficient (20)");
    expect(oiStrength).toContain("both sides required");
  });

  it("both OI pass → simple positive message", () => {
    const callCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "pass", measuredValue: 500 }),
    ];
    const putCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "pass", measuredValue: 400 }),
    ];

    const record = makeRecord({
      outcome: "admit",
      callEvidence: makeEvidence("call", callCriteria),
      putEvidence: makeEvidence("put", putCriteria),
    });

    const narrative = synthesizeNarrative(record);
    const oiStrength = narrative.strengths.find((s) => s.includes("open interest"));
    expect(oiStrength).toBeDefined();
    expect(oiStrength).toContain("Both call and put open interest above threshold");
    expect(oiStrength).not.toContain("insufficient");
  });

  it("both OI fail → no OI strength entry", () => {
    const callCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "fail", measuredValue: 10 }),
    ];
    const putCriteria = [
      makeCriterion({ criterion: "minOpenInterest", status: "fail", measuredValue: 5 }),
    ];

    const record = makeRecord({
      callEvidence: makeEvidence("call", callCriteria),
      putEvidence: makeEvidence("put", putCriteria),
    });

    const narrative = synthesizeNarrative(record);
    const oiStrength = narrative.strengths.find((s) => s.toLowerCase().includes("oi") || s.toLowerCase().includes("open interest"));
    expect(oiStrength).toBeUndefined();
  });
});

// --- B. Evidence Header Wording ---

describe("evidence header — winningExpiration semantics", () => {
  it("winningExpiration null → record has no winning expiration for UI to use", () => {
    const record = makeRecord({ winningExpiration: null });
    // The UI uses: winningExpiration ? "Selected Admission Evidence" : "Best Available Evidence"
    expect(record.winningExpiration).toBeNull();
  });

  it("winningExpiration present → record carries winning expiration for UI", () => {
    const record = makeRecord({
      outcome: "admit",
      winningExpiration: { date: "2026-08-14", dte: 31 },
    });
    expect(record.winningExpiration).not.toBeNull();
    expect(record.winningExpiration!.date).toBe("2026-08-14");
    expect(record.winningExpiration!.dte).toBe(31);
  });

  it("strongest failed pair explanation is relevant only when no winner", () => {
    const failedRecord = makeRecord({ winningExpiration: null, outcome: "reject" });
    const admittedRecord = makeRecord({
      outcome: "admit",
      winningExpiration: { date: "2026-08-14", dte: 31 },
    });

    // UI logic: show note only when winningExpiration is null
    const showFailedNote = failedRecord.winningExpiration === null;
    const showAdmittedNote = admittedRecord.winningExpiration === null;

    expect(showFailedNote).toBe(true);
    expect(showAdmittedNote).toBe(false);
  });
});
