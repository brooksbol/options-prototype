/**
 * Tests for multi-level coverage semantics.
 */

import { describe, it, expect } from "vitest";
import {
  computeUniverseCoverage,
  type SymbolCoverageState,
  type RecommendationReadiness,
} from "../../src/market-session/coverage-semantics";

function makeState(symbol: string, level: SymbolCoverageState["level"], currentSession = true): SymbolCoverageState {
  return { symbol, level, evidenceSessionDate: currentSession ? "2026-07-13" : "2026-07-10", currentSession };
}

describe("computeUniverseCoverage", () => {
  it("all UNKNOWN → NO_EVIDENCE", () => {
    const states = [makeState("A", "UNKNOWN"), makeState("B", "UNKNOWN")];
    const cov = computeUniverseCoverage(states, 0, "2026-07-13");
    expect(cov.readiness).toBe("NO_EVIDENCE");
    expect(cov.unknown).toBe(2);
    expect(cov.total).toBe(2);
  });

  it("mix of UNKNOWN and EXPIRATION_KNOWN → EXPIRATION_DISCOVERY", () => {
    const states = [makeState("A", "EXPIRATION_KNOWN"), makeState("B", "UNKNOWN")];
    const cov = computeUniverseCoverage(states, 0, "2026-07-13");
    expect(cov.readiness).toBe("EXPIRATION_DISCOVERY");
    expect(cov.expirationOnly).toBe(1);
  });

  it("some PRIMARY_EVALUATED, others not → PRIMARY_BUILDING", () => {
    const states = [
      makeState("A", "PRIMARY_EVALUATED"),
      makeState("B", "PRIMARY_EVALUATED"),
      makeState("C", "EXPIRATION_KNOWN"),
      makeState("D", "UNKNOWN"),
    ];
    const cov = computeUniverseCoverage(states, 0, "2026-07-13");
    expect(cov.readiness).toBe("PRIMARY_BUILDING");
    expect(cov.primaryEvaluated).toBe(2);
  });

  it("all optionable PRIMARY_EVALUATED → PRIMARY_COMPLETE", () => {
    const states = [
      makeState("A", "PRIMARY_EVALUATED"),
      makeState("B", "PRIMARY_EVALUATED"),
      makeState("C", "PRIMARY_EVALUATED"),
    ];
    // 3 optionable + 2 confirmed absence = 5 total
    const cov = computeUniverseCoverage(states, 2, "2026-07-13");
    expect(cov.readiness).toBe("PRIMARY_COMPLETE");
    expect(cov.total).toBe(5);
    expect(cov.primaryEvaluated).toBe(3);
    expect(cov.confirmedAbsence).toBe(2);
  });

  it("some DEEP_EVALUATED among PRIMARY but not all covered → CONTENDER_DEEPENING", () => {
    const states = [
      makeState("A", "DEEP_EVALUATED"),
      makeState("B", "PRIMARY_EVALUATED"),
      makeState("C", "EXPIRATION_KNOWN"),  // not yet primary-evaluated
    ];
    const cov = computeUniverseCoverage(states, 0, "2026-07-13");
    expect(cov.readiness).toBe("CONTENDER_DEEPENING");
  });

  it("all DEEP_EVALUATED → FULLY_EVALUATED", () => {
    const states = [
      makeState("A", "DEEP_EVALUATED"),
      makeState("B", "DEEP_EVALUATED"),
    ];
    const cov = computeUniverseCoverage(states, 1, "2026-07-13");
    expect(cov.readiness).toBe("FULLY_EVALUATED");
  });

  it("all optionable evaluated (mix primary+deep) → CONTENDER_VALIDATED", () => {
    const states = [
      makeState("A", "DEEP_EVALUATED"),
      makeState("B", "DEEP_EVALUATED"),
      makeState("C", "PRIMARY_EVALUATED"),
      makeState("D", "PRIMARY_EVALUATED"),
    ];
    // 4 optionable, all evaluated, some deep
    const cov = computeUniverseCoverage(states, 0, "2026-07-13");
    expect(cov.readiness).toBe("CONTENDER_VALIDATED");
  });

  it("confirmed absence correctly reduces optionable count", () => {
    const states = [makeState("A", "PRIMARY_EVALUATED")];
    // 1 optionable + 59 absent = 60 total, 1 evaluated = PRIMARY_COMPLETE
    const cov = computeUniverseCoverage(states, 59, "2026-07-13");
    expect(cov.total).toBe(60);
    expect(cov.confirmedAbsence).toBe(59);
    expect(cov.readiness).toBe("PRIMARY_COMPLETE");
  });

  it("preserves canonical session date", () => {
    const states = [makeState("A", "UNKNOWN")];
    const cov = computeUniverseCoverage(states, 0, "2026-07-10");
    expect(cov.canonicalSessionDate).toBe("2026-07-10");
  });
});
