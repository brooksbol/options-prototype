/**
 * ADR-022 / Doc 70 — frontend consumption of the backend-owned continuity verdict.
 *
 * Falsifies the ratified boundaries at the consumption seam:
 *   - covered-call membership is driven by the BACKEND continuity verdict, never a series key;
 *   - a legacy series-key association alone (no continuity assessment) does NOT establish
 *     membership (ADR-022 §6): it is AUTHORITY_MISSING;
 *   - EXHAUSTED projects outside-program (known negative), not a false affirmative;
 *   - POLICY_UNDEFINED (partial/ambiguous) blocks membership without inventing residual policy;
 *   - the Recommendation stays UNRESOLVED even when full-Q intact (call-away/policy gaps);
 *   - the continuity verdict is pinned for replay (client resolve wrapper).
 */

import { describe, it, expect, vi } from "vitest";
import { evaluateCoveredCall, type CoveredCallFacts, type GovernedInputsBase } from "../../src/governed-decision/evaluators";
import type { GovernedContextVersion } from "../../src/governed-decision/governed-context";
import { resolveContinuityAssessment } from "../../src/governed-decision/client";

const goodCall: CoveredCallFacts = { callIsCurrent: true, coverageEstablished: true, evidenceSufficient: true };

function ctx(overrides: Partial<GovernedContextVersion> = {}): GovernedContextVersion {
  return {
    brokerageAccountId: "acctA", governedScopeId: "scope1", contextVersionId: "ctx_1", version: 1,
    supersedesContextVersionId: null, program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "unknown", eligibilityGate: "UNKNOWN", interventionGate: "UNKNOWN", noWriteGate: "UNKNOWN",
    authorityProvenance: "operator-governance", effectiveFrom: "2026-09-01T00:00:00Z",
    recordedAt: "2026-09-01T00:00:00Z", ...overrides,
  };
}
const status = (r: ReturnType<typeof evaluateCoveredCall>, k: string) =>
  r.predicateResults.find((p) => p.key === k)?.status;

describe("covered-call membership is the backend continuity verdict, not a series key", () => {
  it("legacy association + context but NO continuity assessment => AUTHORITY_MISSING (not inferred)", () => {
    const inputs: GovernedInputsBase = { context: ctx(), associationEstablished: true };
    const r = evaluateCoveredCall(goodCall, inputs);
    expect(status(r, "wheel-membership")).toBe("AUTHORITY_MISSING");
    expect(r.recommendation).toBe("UNRESOLVED");
  });

  it("FULL_Q_INTACT_APPLICABLE => membership SATISFIED, but Recommendation still UNRESOLVED", () => {
    const inputs: GovernedInputsBase = {
      context: ctx(), associationEstablished: true,
      continuity: { verdict: "FULL_Q_INTACT_APPLICABLE", evidenceHash: "ceh_x", admissionRuleVersion: "continuity-admission-v1" },
    };
    const r = evaluateCoveredCall(goodCall, inputs);
    expect(status(r, "wheel-membership")).toBe("SATISFIED");
    // call-away pre-acceptance is the next missing authority; still UNRESOLVED.
    expect(r.recommendation).toBe("UNRESOLVED");
  });

  it("EXHAUSTED => membership NOT_SATISFIED and outside-program (known negative)", () => {
    const inputs: GovernedInputsBase = {
      context: ctx(), associationEstablished: true,
      continuity: { verdict: "EXHAUSTED", evidenceHash: "ceh_x", admissionRuleVersion: "continuity-admission-v1" },
    };
    const r = evaluateCoveredCall(goodCall, inputs);
    expect(status(r, "wheel-membership")).toBe("NOT_SATISFIED");
    expect(r.programApplicability).toBe("outside-program");
  });

  it("POLICY_UNDEFINED (partial/ambiguous) blocks membership without inventing residual policy", () => {
    const inputs: GovernedInputsBase = {
      context: ctx(), associationEstablished: true,
      continuity: { verdict: "POLICY_UNDEFINED", evidenceHash: "ceh_x", admissionRuleVersion: "continuity-admission-v1" },
    };
    const r = evaluateCoveredCall(goodCall, inputs);
    expect(status(r, "wheel-membership")).toBe("POLICY_UNDEFINED");
    expect(r.recommendation).toBe("UNRESOLVED");
  });

  it("EVIDENCE_INSUFFICIENT verdict => membership EVIDENCE_INSUFFICIENT (fail closed)", () => {
    const inputs: GovernedInputsBase = {
      context: ctx(), associationEstablished: true,
      continuity: { verdict: "EVIDENCE_INSUFFICIENT", evidenceHash: "ceh_x", admissionRuleVersion: "continuity-admission-v1" },
    };
    const r = evaluateCoveredCall(goodCall, inputs);
    expect(status(r, "wheel-membership")).toBe("EVIDENCE_INSUFFICIENT");
    expect(r.recommendation).toBe("UNRESOLVED");
  });
});

describe("resolveContinuityAssessment client", () => {
  it("returns the backend verdict when resolved", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        resolved: true,
        assessment: { verdict: "FULL_Q_INTACT_APPLICABLE", evidenceHash: "ceh_abc", admissionRuleVersion: "continuity-admission-v1" },
      }),
    });
    const res = await resolveContinuityAssessment(
      { brokerageAccountId: "acctA", underlying: "XLE", optionType: "CALL", strike: 57.5,
        expiration: "2026-10-16", effectiveAsOf: "2026-09-27T00:00:00Z", knowledgeCutoff: "2026-09-27T00:00:00Z" },
      fetchMock as unknown as typeof fetch,
    );
    expect(res?.verdict).toBe("FULL_Q_INTACT_APPLICABLE");
    expect(res?.evidenceHash).toBe("ceh_abc");
  });

  it("returns null when the backend has no assessment (never inferred)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ resolved: false }) });
    const res = await resolveContinuityAssessment(
      { brokerageAccountId: "acctA", underlying: "XLE", optionType: "CALL", strike: 57.5,
        expiration: "2026-10-16", effectiveAsOf: "2026-09-27T00:00:00Z", knowledgeCutoff: "2026-09-27T00:00:00Z" },
      fetchMock as unknown as typeof fetch,
    );
    expect(res).toBeNull();
  });
});
