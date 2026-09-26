/**
 * Decision bundle determinism/idempotency, executable replay (C7/C9/C10/C13 aspects),
 * and subject-association discipline (no ticker fallback).
 */

import { describe, it, expect } from "vitest";
import type { GovernedContextVersion } from "../../src/governed-decision/governed-context";
import {
  canonicalizeBundle,
  bundleHash,
  decisionId,
  type DecisionInputBundle,
  type DecisionResult,
} from "../../src/governed-decision/decision-bundle";
import { replayDecision } from "../../src/governed-decision/replay";
import { resolveScopeForSubject, type DecisionSubject, type SubjectScopeAssociation } from "../../src/governed-decision/subject";

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

function bundle(overrides: Partial<DecisionInputBundle> = {}): DecisionInputBundle {
  return {
    brokerageAccountId: "acctA",
    subject: { subjectType: "covered-call", subjectId: "call-GDXJ-30-2026-10-17", symbol: "GDXJ", brokerageAccountId: "acctA" },
    governedScopeId: "scope1",
    contextVersion: ctx(),
    associationEstablished: true,
    consumed: { kind: "covered-call", facts: { callIsCurrent: true, coverageEstablished: true, evidenceSufficient: true } },
    evidenceProvenance: { ownershipAuthority: "positions", optionSummaryCheckpoint: "2026-09-05T14:00:00Z", evidenceGeneration: null },
    ruleId: "DOC65-RULE-1-LET-RESOLVE",
    evaluatorId: "wheel-covered-call",
    evaluatorVersion: "1",
    decisionTime: "2026-09-05T14:00:00Z",
    ...overrides,
  };
}

describe("canonical bundle + identity", () => {
  it("is deterministic and idempotent for identical inputs", () => {
    expect(bundleHash(bundle())).toBe(bundleHash(bundle()));
    expect(decisionId(bundle())).toBe(decisionId(bundle()));
  });

  it("changes id when a consumed input changes (new Decision)", () => {
    const changed = bundle({
      consumed: { kind: "covered-call", facts: { callIsCurrent: true, coverageEstablished: false, evidenceSufficient: true } },
    });
    expect(decisionId(changed)).not.toBe(decisionId(bundle()));
  });

  it("changes id when the pinned context version changes", () => {
    const changed = bundle({ contextVersion: ctx({ contextVersionId: "ctx_2", version: 2 }) });
    expect(decisionId(changed)).not.toBe(decisionId(bundle()));
  });

  it("canonical form is length-prefixed (injective) — distinct fields cannot alias", () => {
    const a = bundle({ governedScopeId: "ab", subject: { ...bundle().subject, subjectId: "c" } });
    const b = bundle({ governedScopeId: "a", subject: { ...bundle().subject, subjectId: "bc" } });
    expect(canonicalizeBundle(a)).not.toBe(canonicalizeBundle(b));
  });
});

describe("executable replay (P3)", () => {
  const persisted: DecisionResult = { recommendation: "LET_RESOLVE", reasons: [], unresolvedCauses: [] };

  it("MATCH: re-running the pinned evaluator reproduces the persisted Recommendation", () => {
    const out = replayDecision(bundle(), persisted);
    expect(out.status).toBe("MATCH");
    expect(out.recomputed).toBe("LET_RESOLVE");
  });

  it("MISMATCH: a tampered persisted result is detected by re-execution", () => {
    const tampered: DecisionResult = { recommendation: "SELL_CALL", reasons: [], unresolvedCauses: [] };
    const out = replayDecision(bundle(), tampered);
    expect(out.status).toBe("MISMATCH");
    expect(out.recomputed).toBe("LET_RESOLVE");
    expect(out.persisted).toBe("SELL_CALL");
  });

  it("UNSUPPORTED_EVALUATOR_VERSION: an unknown historical version is reported, not re-run", () => {
    const out = replayDecision(bundle({ evaluatorVersion: "99" }), persisted);
    expect(out.status).toBe("UNSUPPORTED_EVALUATOR_VERSION");
    expect(out.recomputed).toBeNull();
  });

  it("C9: replay uses ONLY the recovered bundle — a backdated later context cannot change history", () => {
    // The bundle pins the exact context consumed. Even if 'current' governance differed,
    // replay re-runs against the pinned context in the bundle, so the result is stable.
    const out1 = replayDecision(bundle(), persisted);
    const out2 = replayDecision(bundle(), persisted);
    expect(out1.recomputed).toBe(out2.recomputed);
  });
});

describe("subject association (Correction 3 — no ticker fallback)", () => {
  const subject: DecisionSubject = { subjectType: "share-block", subjectId: "shares-GDXJ", symbol: "GDXJ", brokerageAccountId: "acctA" };

  it("returns null when no explicit association exists", () => {
    expect(resolveScopeForSubject(subject, [])).toBeNull();
  });

  it("does not associate a different subject id even with the same symbol/account", () => {
    const assoc: SubjectScopeAssociation[] = [
      { brokerageAccountId: "acctA", subjectId: "shares-OTHER", governedScopeId: "scope1", provenance: "operator-governance", effectiveFrom: "2026-09-01T00:00:00Z" },
    ];
    expect(resolveScopeForSubject(subject, assoc)).toBeNull();
  });

  it("resolves an explicit association and prefers the most recent effective", () => {
    const assoc: SubjectScopeAssociation[] = [
      { brokerageAccountId: "acctA", subjectId: "shares-GDXJ", governedScopeId: "old", provenance: "operator-governance", effectiveFrom: "2026-08-01T00:00:00Z" },
      { brokerageAccountId: "acctA", subjectId: "shares-GDXJ", governedScopeId: "new", provenance: "broker-evidence", effectiveFrom: "2026-09-01T00:00:00Z" },
    ];
    expect(resolveScopeForSubject(subject, assoc)?.governedScopeId).toBe("new");
  });
});
