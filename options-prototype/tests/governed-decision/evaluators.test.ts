/**
 * Contrastive acceptance C1–C8 (+ governance-abuse) for the bounded governed evaluators.
 *
 * These tests falsify SEMANTIC mistakes: they prove mechanical similarity never produces a
 * positive Recommendation without authorized governance + explicit association + evidence,
 * and that missing gates fail closed (UNKNOWN) rather than clearing.
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

function ctx(overrides: Partial<GovernedContextVersion> = {}): GovernedContextVersion {
  return {
    brokerageAccountId: "acctA",
    governedScopeId: "scope1",
    contextVersionId: "ctx_1",
    version: 1,
    supersedesContextVersionId: null,
    program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted",
    eligibilityGate: "CLEAR",
    interventionGate: "CLEAR",
    noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance",
    effectiveFrom: "2026-09-01T00:00:00Z",
    recordedAt: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

const goodCall: CoveredCallFacts = {
  callIsCurrent: true,
  coverageEstablished: true,
  evidenceSufficient: true,
};
const goodShares: ShareBlockFacts = {
  freeShares: 100,
  ownershipAuthority: "positions",
  evidenceSufficient: true,
};
const associated = (context: GovernedContextVersion): GovernedInputsBase => ({
  context,
  associationEstablished: true,
});

describe("Rule 1 — covered call (LET RESOLVE | UNRESOLVED)", () => {
  it("C1: governed call, call-away accepted, intervention CLEAR -> LET_RESOLVE", () => {
    const r = evaluateCoveredCall(goodCall, associated(ctx()));
    expect(r.recommendation).toBe("LET_RESOLVE");
    expect(r.unresolvedCauses).toHaveLength(0);
  });

  it("C2: mechanically identical call, NO governed context/association -> UNRESOLVED", () => {
    const r = evaluateCoveredCall(goodCall, { context: null, associationEstablished: false });
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("no-governed-scope-association");
  });

  it("C3: same governance but intervention UNKNOWN -> UNRESOLVED", () => {
    const r = evaluateCoveredCall(goodCall, associated(ctx({ interventionGate: "UNKNOWN" })));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("intervention-condition-unknown");
  });

  it("C4: same governance but intervention ACTIVE -> UNRESOLVED (no BTC/CLOSE/ROLL invented)", () => {
    const r = evaluateCoveredCall(goodCall, associated(ctx({ interventionGate: "ACTIVE" })));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("governed-intervention-condition-active");
    // Only the bounded vocabulary is ever emitted.
    expect(["LET_RESOLVE", "SELL_CALL", "UNRESOLVED"]).toContain(r.recommendation);
  });

  it("call-away stance not accepted -> UNRESOLVED", () => {
    const r = evaluateCoveredCall(goodCall, associated(ctx({ callAwayStance: "unknown" })));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("call-away-stance-not-accepted");
  });

  it("coverage not established -> UNRESOLVED (never infers from geometry)", () => {
    const r = evaluateCoveredCall({ ...goodCall, coverageEstablished: false }, associated(ctx()));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("coverage-not-established");
  });
});

describe("Rule 2 — share phase (SELL CALL | UNRESOLVED)", () => {
  it("C5: governed free 100-share block, eligibility+no-write CLEAR, call-away accepted -> SELL_CALL", () => {
    const r = evaluateSharePhase(goodShares, associated(ctx()));
    expect(r.recommendation).toBe("SELL_CALL");
    expect(r.unresolvedCauses).toHaveLength(0);
  });

  it("C6: mechanically identical shares, NO governed association -> UNRESOLVED", () => {
    const r = evaluateSharePhase(goodShares, { context: null, associationEstablished: false });
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("no-governed-scope-association");
  });

  it("C8: missing eligibility gate (UNKNOWN) -> UNRESOLVED (never CLEAR by default)", () => {
    const r = evaluateSharePhase(goodShares, associated(ctx({ eligibilityGate: "UNKNOWN" })));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("program-eligibility-unknown");
  });

  it("no-write ACTIVE -> UNRESOLVED", () => {
    const r = evaluateSharePhase(goodShares, associated(ctx({ noWriteGate: "ACTIVE" })));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("governed-no-write-condition-active");
  });

  it("fewer than 100 free shares -> UNRESOLVED", () => {
    const r = evaluateSharePhase({ ...goodShares, freeShares: 50 }, associated(ctx()));
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("insufficient-free-shares-for-one-lot");
  });

  it("ownership authority absent -> UNRESOLVED (ADR-020: no authoritative ownership)", () => {
    const r = evaluateSharePhase(
      { freeShares: 100, ownershipAuthority: null, evidenceSufficient: false },
      associated(ctx()),
    );
    expect(r.recommendation).toBe("UNRESOLVED");
    expect(r.unresolvedCauses).toContain("ownership-authority-absent");
  });
});

describe("governance-abuse guard (Correction 1)", () => {
  const base = {
    brokerageAccountId: "acctA",
    governedScopeId: "scope1",
    program: { program: "assignment-centric-wheel" as const, configVersion: "1" },
    callAwayStance: "accepted" as CallAwayStance,
    eligibilityGate: "CLEAR" as GateState,
    interventionGate: "CLEAR" as GateState,
    noWriteGate: "CLEAR" as GateState,
    effectiveFrom: "2026-09-01T00:00:00Z",
  };

  it("accepts an explicit operator-governance assertion", () => {
    expect(validateGovernedContextDraft({ ...base, authorityProvenance: "operator-governance" })).toEqual([]);
  });

  it("rejects broker-evidence / derived / unknown as governance authority", () => {
    for (const prov of ["broker-evidence", "derived", "unknown"] as const) {
      const v = validateGovernedContextDraft({ ...base, authorityProvenance: prov });
      expect(v.length).toBeGreaterThan(0);
    }
  });

  it("rejects missing scope / account", () => {
    expect(
      validateGovernedContextDraft({ ...base, authorityProvenance: "operator-governance", governedScopeId: "" }).length,
    ).toBeGreaterThan(0);
  });
});
