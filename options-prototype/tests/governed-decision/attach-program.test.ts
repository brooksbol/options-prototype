/**
 * ATTACH TO… walking slice (Doc 69) acceptance.
 *
 * Falsifies the load-bearing semantics of the first admissible resolution control:
 *   - the membership affordance is an ADMISSIBLE control ONLY for a bounded covered-call
 *     subject; the symbol-level share-block membership affordance stays inadmissible;
 *   - attaching establishes ONLY membership — the Recommendation stays UNRESOLVED because
 *     intervention/eligibility/no-write remain POLICY_UNDEFINED and stance is not set;
 *   - the client attach wrapper transports the operator's intent and surfaces its result;
 *   - a bounded covered-call subject id is used (never "all free shares of a symbol").
 */

import { describe, it, expect, vi } from "vitest";
import {
  evaluateCoveredCall,
  evaluateSharePhase,
  type CoveredCallFacts,
  type ShareBlockFacts,
} from "../../src/governed-decision/evaluators";
import { admissibleControlFor } from "../../src/governed-decision/control-admissibility";
import { attachProgram } from "../../src/governed-decision/client";

const goodCall: CoveredCallFacts = { callIsCurrent: true, coverageEstablished: true, evidenceSufficient: true };
const goodShares: ShareBlockFacts = { freeShares: 100, ownershipAuthority: "positions", evidenceSufficient: true };

function membership(results: { key: string }[]) {
  return results.find((p) => p.key === "wheel-membership")!;
}

describe("ATTACH TO… admissibility (Doc 69)", () => {
  it("covered-call unattached membership advertises the ADMISSIBLE attach capability", () => {
    const r = evaluateCoveredCall(goodCall, { context: null, associationEstablished: false });
    const m = membership(r.predicateResults);
    expect(m.status).toBe("AUTHORITY_MISSING");
    // The single admissible resolution control is the attach capability.
    expect(admissibleControlFor(m)).toBe("attach-assignment-centric-wheel");
  });

  it("share-block (symbol-level) membership is NOT an admissible control in this slice", () => {
    const r = evaluateSharePhase(goodShares, { context: null, associationEstablished: false });
    const m = membership(r.predicateResults);
    expect(m.status).toBe("AUTHORITY_MISSING");
    // Symbol-level share-block attachment would mean "all free shares of the symbol"; refused.
    expect(admissibleControlFor(m)).toBeNull();
  });

  it("once membership is established, no attach control is offered (already attached)", () => {
    // A resolved association+context makes membership SATISFIED; the affordance is gone.
    const ctx = {
      brokerageAccountId: "acctA", governedScopeId: "scope1", contextVersionId: "ctx_1", version: 1,
      supersedesContextVersionId: null,
      program: { program: "assignment-centric-wheel" as const, configVersion: "1" },
      callAwayStance: "unknown" as const, eligibilityGate: "UNKNOWN" as const,
      interventionGate: "UNKNOWN" as const, noWriteGate: "UNKNOWN" as const,
      authorityProvenance: "operator-governance" as const,
      effectiveFrom: "2026-09-01T00:00:00Z", recordedAt: "2026-09-01T00:00:00Z",
    };
    const r = evaluateCoveredCall(goodCall, {
      context: ctx,
      associationEstablished: true,
      // ADR-022 / Doc 70: covered-call membership is established by the backend continuity
      // verdict, not by the association alone.
      continuity: { verdict: "FULL_Q_INTACT_APPLICABLE", evidenceHash: "ceh_test", admissionRuleVersion: "continuity-admission-v1" },
    });
    const m = membership(r.predicateResults);
    expect(m.status).toBe("SATISFIED");
    expect(admissibleControlFor(m)).toBeNull();
  });

  it("attaching establishes ONLY membership — Recommendation stays UNRESOLVED (policy undefined)", () => {
    // Simulate the post-attach reevaluation: association established + membership-only context
    // (nothing affirmative: unknown stance, UNKNOWN gates), exactly what the attach writes.
    const membershipOnlyContext = {
      brokerageAccountId: "acctA", governedScopeId: "scope_x", contextVersionId: "ctx_x", version: 1,
      supersedesContextVersionId: null,
      program: { program: "assignment-centric-wheel" as const, configVersion: "1" },
      callAwayStance: "unknown" as const, eligibilityGate: "UNKNOWN" as const,
      interventionGate: "UNKNOWN" as const, noWriteGate: "UNKNOWN" as const,
      authorityProvenance: "operator-governance" as const,
      effectiveFrom: "2026-09-27T00:00:00Z", recordedAt: "2026-09-27T00:00:00Z",
    };
    const r = evaluateCoveredCall(goodCall, {
      context: membershipOnlyContext,
      associationEstablished: true,
      continuity: { verdict: "FULL_Q_INTACT_APPLICABLE", evidenceHash: "ceh_test", admissionRuleVersion: "continuity-admission-v1" },
    });
    // Membership flipped to established...
    expect(membership(r.predicateResults).status).toBe("SATISFIED");
    // ...but call-away pre-acceptance is now the next missing authority, and intervention is
    // still POLICY_UNDEFINED, so the Recommendation is still UNRESOLVED (no policy invented).
    const status = (k: string) => r.predicateResults.find((p) => p.key === k)?.status;
    expect(status("call-away-preacceptance")).toBe("AUTHORITY_MISSING");
    expect(status("intervention-policy")).toBe("POLICY_UNDEFINED");
    expect(r.recommendation).toBe("UNRESOLVED");
  });
});

describe("attachProgram client", () => {
  it("posts the bounded subject to the attach endpoint and returns the durable ids", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "attached",
        program: "assignment-centric-wheel",
        configVersion: "1",
        governedScopeId: "scope_abc",
        contextVersionId: "ctx_abc",
        associationId: "assoc_abc",
        effectiveFrom: "2026-09-27T00:00:00Z",
        recordedAt: "2026-09-27T00:00:00Z",
      }),
    });
    const res = await attachProgram(
      { brokerageAccountId: "acctA", subjectId: "call-URA-43-2026-10-17", subjectType: "covered-call" },
      fetchMock as unknown as typeof fetch,
    );
    expect(res.ok).toBe(true);
    expect(res.program).toBe("assignment-centric-wheel");
    expect(res.governedScopeId).toBe("scope_abc");
    // The bounded covered-call subject id is what was sent (not a symbol-level identity).
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.subjectId).toBe("call-URA-43-2026-10-17");
    expect(body.subjectType).toBe("covered-call");
  });

  it("surfaces backend rejection (e.g. share-block refusal) as an error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "only a bounded covered-call subject may be attached in this slice" }),
    });
    const res = await attachProgram(
      { brokerageAccountId: "acctA", subjectId: "shares-URA", subjectType: "share-block" },
      fetchMock as unknown as typeof fetch,
    );
    expect(res.ok).toBe(false);
    expect(res.error).toContain("bounded covered-call subject");
  });
});
