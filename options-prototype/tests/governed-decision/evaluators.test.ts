/**
 * ADR-021 predicate-picture acceptance for the bounded governed evaluators.
 *
 * These tests falsify SEMANTIC mistakes under the ADR-021 model:
 *   - mechanical similarity never establishes membership (AUTHORITY_MISSING, not a positive);
 *   - the complete ordered predicate picture is always returned (no first-blocker short-circuit);
 *   - downstream predicates are NOT_EVALUATED (with blockedBy) when a prerequisite is absent;
 *   - intervention/eligibility/no-write are POLICY_UNDEFINED (never silently CLEAR), which
 *     keeps affirmative outcomes blocked pending separate policy ratification (ADR-021 §8);
 *   - authoritative negative membership projects outside-program (not UNRESOLVED, no 4th enum).
 */

import { describe, it, expect } from "vitest";
import {
  evaluateCoveredCall,
  evaluateSharePhase,
  type CoveredCallFacts,
  type ShareBlockFacts,
  type GovernedInputsBase,
} from "../../src/governed-decision/evaluators";
import type { GovernedContextVersion } from "../../src/governed-decision/governed-context";
import { validateGovernedContextDraft } from "../../src/governed-decision/governed-context";
import type { GateState, CallAwayStance } from "../../src/governed-decision/types";
import type { PredicateStatus } from "../../src/governed-decision/predicate";

function ctx(overrides: Partial<GovernedContextVersion> = {}): GovernedContextVersion {
  return {
    brokerageAccountId: "acctA", governedScopeId: "scope1", contextVersionId: "ctx_1", version: 1,
    supersedesContextVersionId: null, program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted", eligibilityGate: "CLEAR", interventionGate: "CLEAR", noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance", effectiveFrom: "2026-09-01T00:00:00Z",
    recordedAt: "2026-09-01T00:00:00Z", ...overrides,
  };
}

const goodCall: CoveredCallFacts = { callIsCurrent: true, coverageEstablished: true, evidenceSufficient: true };
const goodShares: ShareBlockFacts = { freeShares: 100, ownershipAuthority: "positions", evidenceSufficient: true };
const associated = (context: GovernedContextVersion): GovernedInputsBase => ({ context, associationEstablished: true });

/** Helper: status of a predicate by key. */
function statusOf(results: { key: string; status: PredicateStatus }[], key: string): PredicateStatus | undefined {
  return results.find((p) => p.key === key)?.status;
}

describe("Rule 1 — covered call predicate picture", () => {
  it("no membership: complete picture with AUTHORITY_MISSING membership + NOT_EVALUATED dependents", () => {
    const r = evaluateCoveredCall(goodCall, { context: null, associationEstablished: false });
    expect(r.recommendation).toBe("UNRESOLVED");
    const P = r.predicateResults;
    // Independent mechanical/evidence predicates are still evaluated.
    expect(statusOf(P, "covered-call-current")).toBe("SATISFIED");
    expect(statusOf(P, "coverage")).toBe("SATISFIED");
    // Membership is AUTHORITY_MISSING (not UNKNOWN, not a negative).
    expect(statusOf(P, "wheel-membership")).toBe("AUTHORITY_MISSING");
    // Dependents are NOT_EVALUATED, blocked by membership.
    expect(statusOf(P, "call-away-preacceptance")).toBe("NOT_EVALUATED");
    const dep = P.find((p) => p.key === "call-away-preacceptance");
    expect(dep?.blockedBy).toContain("wheel-membership");
    // Intervention policy is POLICY_UNDEFINED regardless.
    expect(statusOf(P, "intervention-policy")).toBe("POLICY_UNDEFINED");
  });

  it("membership + accepted stance, but intervention POLICY_UNDEFINED keeps it UNRESOLVED", () => {
    const r = evaluateCoveredCall(goodCall, associated(ctx()));
    expect(r.recommendation).toBe("UNRESOLVED"); // gate policy undefined blocks affirmative
    const P = r.predicateResults;
    expect(statusOf(P, "wheel-membership")).toBe("SATISFIED");
    expect(statusOf(P, "call-away-preacceptance")).toBe("SATISFIED");
    expect(statusOf(P, "call-away-effective")).toBe("SATISFIED");
    expect(statusOf(P, "intervention-policy")).toBe("POLICY_UNDEFINED");
  });

  it("membership without attested pre-acceptance: pre-acceptance AUTHORITY_MISSING, effective NOT_EVALUATED", () => {
    const r = evaluateCoveredCall(goodCall, associated(ctx({ callAwayStance: "unknown" })));
    expect(r.recommendation).toBe("UNRESOLVED");
    const P = r.predicateResults;
    expect(statusOf(P, "call-away-preacceptance")).toBe("AUTHORITY_MISSING");
    expect(statusOf(P, "call-away-effective")).toBe("NOT_EVALUATED");
  });

  it("coverage insufficient is reported independently as EVIDENCE_INSUFFICIENT", () => {
    const r = evaluateCoveredCall({ ...goodCall, coverageEstablished: false }, associated(ctx()));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(statusOf(r.predicateResults, "coverage")).toBe("EVIDENCE_INSUFFICIENT");
  });

  it("authoritative negative membership projects outside-program (not UNRESOLVED semantics on membership)", () => {
    const r = evaluateCoveredCall(goodCall, { context: null, associationEstablished: false, membershipNegative: true });
    expect(r.programApplicability).toBe("outside-program");
    expect(statusOf(r.predicateResults, "wheel-membership")).toBe("NOT_SATISFIED");
    // Public vocabulary unchanged (no 4th enum).
    expect(["LET_RESOLVE", "SELL_CALL", "UNRESOLVED"]).toContain(r.recommendation);
  });

  it("only the bounded public vocabulary is ever emitted", () => {
    const r = evaluateCoveredCall(goodCall, associated(ctx({ interventionGate: "ACTIVE" })));
    expect(["LET_RESOLVE", "SELL_CALL", "UNRESOLVED"]).toContain(r.recommendation);
  });
});

describe("Rule 2 — share phase predicate picture", () => {
  it("no membership: free-lot SATISFIED, membership AUTHORITY_MISSING, call-away NOT_EVALUATED, policies POLICY_UNDEFINED", () => {
    const r = evaluateSharePhase(goodShares, { context: null, associationEstablished: false });
    expect(r.recommendation).toBe("UNRESOLVED");
    const P = r.predicateResults;
    expect(statusOf(P, "free-lot")).toBe("SATISFIED");
    expect(statusOf(P, "ownership-evidence")).toBe("SATISFIED");
    expect(statusOf(P, "wheel-membership")).toBe("AUTHORITY_MISSING");
    expect(statusOf(P, "call-away-accepted")).toBe("NOT_EVALUATED");
    expect(statusOf(P, "eligibility-policy")).toBe("POLICY_UNDEFINED");
    expect(statusOf(P, "no-write-policy")).toBe("POLICY_UNDEFINED");
  });

  it("membership + accepted, but eligibility/no-write POLICY_UNDEFINED keep it UNRESOLVED", () => {
    const r = evaluateSharePhase(goodShares, associated(ctx()));
    expect(r.recommendation).toBe("UNRESOLVED");
    const P = r.predicateResults;
    expect(statusOf(P, "wheel-membership")).toBe("SATISFIED");
    expect(statusOf(P, "call-away-accepted")).toBe("SATISFIED");
    expect(statusOf(P, "eligibility-policy")).toBe("POLICY_UNDEFINED");
    expect(statusOf(P, "no-write-policy")).toBe("POLICY_UNDEFINED");
  });

  it("fewer than 100 free shares -> free-lot NOT_SATISFIED", () => {
    const r = evaluateSharePhase({ ...goodShares, freeShares: 50 }, associated(ctx()));
    expect(statusOf(r.predicateResults, "free-lot")).toBe("NOT_SATISFIED");
  });

  it("ownership authority absent -> ownership-evidence EVIDENCE_INSUFFICIENT", () => {
    const r = evaluateSharePhase(
      { freeShares: 100, ownershipAuthority: null, evidenceSufficient: false }, associated(ctx()));
    expect(statusOf(r.predicateResults, "ownership-evidence")).toBe("EVIDENCE_INSUFFICIENT");
  });
});

describe("governance-abuse guard (Correction 1)", () => {
  const base = {
    brokerageAccountId: "acctA", governedScopeId: "scope1",
    program: { program: "assignment-centric-wheel" as const, configVersion: "1" },
    callAwayStance: "accepted" as CallAwayStance, eligibilityGate: "CLEAR" as GateState,
    interventionGate: "CLEAR" as GateState, noWriteGate: "CLEAR" as GateState,
    effectiveFrom: "2026-09-01T00:00:00Z",
  };
  it("accepts an explicit operator-governance assertion", () => {
    expect(validateGovernedContextDraft({ ...base, authorityProvenance: "operator-governance" })).toEqual([]);
  });
  it("rejects broker-evidence / derived / unknown as governance authority", () => {
    for (const prov of ["broker-evidence", "derived", "unknown"] as const) {
      expect(validateGovernedContextDraft({ ...base, authorityProvenance: prov }).length).toBeGreaterThan(0);
    }
  });
  it("rejects missing scope / account", () => {
    expect(validateGovernedContextDraft({ ...base, authorityProvenance: "operator-governance", governedScopeId: "" }).length).toBeGreaterThan(0);
  });
});
