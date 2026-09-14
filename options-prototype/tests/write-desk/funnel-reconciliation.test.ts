/**
 * Funnel reconciliation-helper tests (BUG-016 correction).
 *
 * Proves the single-accounting-authority guarantees at the helper level:
 *  - deriveTypedCounters seeds every taxonomy key and rejects taxonomy/accounting drift.
 *  - assertReconciled fails loudly when membership.length or the counter sum diverges
 *    from the governed denominator (defensive correctness, not silent repair).
 */

import { describe, it, expect } from "vitest";
import {
  deriveTypedCounters,
  assertReconciled,
} from "../../src/write-desk/funnel-export/funnel-export-types";
import type { TerminalMembershipRecord } from "../../src/write-desk/funnel-export/funnel-export-types";

const KEYS = ["actionable", "edge", "wait", "nonOptionable"] as const;

function rec(symbol: string, terminalOutcome: string): TerminalMembershipRecord {
  return {
    evaluationUnitType: "universe_symbol",
    symbol,
    holdingOrLotId: null,
    expiration: null,
    terminalOutcome,
    terminalReason: null,
    evidenceRetrievedAt: null,
    admissible: null,
  };
}

describe("deriveTypedCounters", () => {
  it("seeds every taxonomy key to 0 and counts membership", () => {
    const counters = deriveTypedCounters([rec("A", "actionable"), rec("B", "actionable"), rec("C", "wait")], KEYS);
    expect(counters).toEqual({ actionable: 2, edge: 0, wait: 1, nonOptionable: 0 });
  });

  it("throws on a terminal outcome outside the strategy taxonomy (accounting/taxonomy drift)", () => {
    expect(() => deriveTypedCounters([rec("A", "not_a_real_bucket")], KEYS)).toThrow(/drift/);
  });
});

describe("assertReconciled", () => {
  it("passes when membership.length and counter sum both equal the denominator", () => {
    expect(() => assertReconciled([rec("A", "actionable"), rec("B", "wait")], 2, "csp")).not.toThrow();
  });

  it("throws when membership.length != denominator", () => {
    expect(() => assertReconciled([rec("A", "actionable")], 2, "csp")).toThrow(/membership.length/);
  });

  it("fails loudly rather than silently repairing", () => {
    // Two records but a denominator of 3 — the missing unit must NOT be silently tolerated.
    expect(() => assertReconciled([rec("A", "actionable"), rec("B", "wait")], 3, "buy_write")).toThrow();
  });
});
