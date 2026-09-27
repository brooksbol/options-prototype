/**
 * Decision bundle determinism/idempotency, executable replay incl. predicate-picture
 * comparison (ADR-021 §10), no-context bundles, and subject-association discipline.
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
import { evaluateCoveredCall } from "../../src/governed-decision/evaluators";
import { resolveScopeForSubject, type DecisionSubject, type SubjectScopeAssociation } from "../../src/governed-decision/subject";

function ctx(overrides: Partial<GovernedContextVersion> = {}): GovernedContextVersion {
  return {
    brokerageAccountId: "acctA", governedScopeId: "scope1", contextVersionId: "ctx_1", version: 1,
    supersedesContextVersionId: null, program: { program: "assignment-centric-wheel", configVersion: "1" },
    callAwayStance: "accepted", eligibilityGate: "CLEAR", interventionGate: "CLEAR", noWriteGate: "CLEAR",
    authorityProvenance: "operator-governance", effectiveFrom: "2026-09-01T00:00:00Z",
    recordedAt: "2026-09-01T00:00:00Z", ...overrides,
  };
}

const CC_FACTS = { callIsCurrent: true, coverageEstablished: true, evidenceSufficient: true };

function bundle(overrides: Partial<DecisionInputBundle> = {}): DecisionInputBundle {
  return {
    brokerageAccountId: "acctA",
    subject: { subjectType: "covered-call", subjectId: "call-GDXJ-30-2026-10-17", symbol: "GDXJ", brokerageAccountId: "acctA" },
    governedScopeId: "scope1",
    contextVersion: ctx(),
    associationEstablished: true,
    consumed: { kind: "covered-call", facts: CC_FACTS },
    evidenceProvenance: { ownershipAuthority: "positions", optionSummaryCheckpoint: "2026-09-05T14:00:00Z", evidenceGeneration: null },
    ruleId: "DOC65-RULE-1-LET-RESOLVE",
    evaluatorId: "wheel-covered-call",
    evaluatorVersion: "2",
    decisionTime: "2026-09-05T14:00:00Z",
    ...overrides,
  };
}

/** The persisted result that matches re-running the evaluator over `b`'s inputs. */
function persistedFor(b: DecisionInputBundle): DecisionResult {
  const e = evaluateCoveredCall(
    b.consumed.kind === "covered-call" ? b.consumed.facts : CC_FACTS,
    { context: b.contextVersion, associationEstablished: b.associationEstablished },
  );
  return {
    recommendation: e.recommendation,
    predicateResults: e.predicateResults,
    programApplicability: e.programApplicability,
    reasons: e.reasons,
    unresolvedCauses: e.unresolvedCauses,
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

  it("supports a NO-CONTEXT bundle (null context/scope) with a stable identity (ADR-021 §10)", () => {
    const noCtx = bundle({ contextVersion: null, governedScopeId: null, associationEstablished: false });
    expect(() => canonicalizeBundle(noCtx)).not.toThrow();
    expect(bundleHash(noCtx)).toBe(bundleHash(noCtx));
    expect(decisionId(noCtx)).not.toBe(decisionId(bundle()));
  });

  it("canonical form is length-prefixed (injective) — distinct fields cannot alias", () => {
    const a = bundle({ governedScopeId: "ab", subject: { ...bundle().subject, subjectId: "c" } });
    const b = bundle({ governedScopeId: "a", subject: { ...bundle().subject, subjectId: "bc" } });
    expect(canonicalizeBundle(a)).not.toBe(canonicalizeBundle(b));
  });
});

describe("executable replay incl. predicate picture (ADR-021 §10)", () => {
  it("MATCH: re-running reproduces BOTH the Recommendation and the predicate picture", () => {
    const b = bundle();
    const out = replayDecision(b, persistedFor(b));
    expect(out.status).toBe("MATCH");
    expect(out.recommendationMatch).toBe(true);
    expect(out.predicatePictureMatch).toBe(true);
  });

  it("MISMATCH on Recommendation: a tampered persisted recommendation is detected", () => {
    const b = bundle();
    const tampered = { ...persistedFor(b), recommendation: "LET_RESOLVE" as const };
    const out = replayDecision(b, tampered);
    expect(out.status).toBe("MISMATCH");
    expect(out.recommendationMatch).toBe(false);
  });

  it("MISMATCH on picture: a tampered predicate picture is detected even if the token matches", () => {
    const b = bundle();
    const base = persistedFor(b);
    const tampered: DecisionResult = {
      ...base,
      predicateResults: base.predicateResults.map((p) =>
        p.key === "intervention-policy" ? { ...p, status: "SATISFIED" } : p),
    };
    const out = replayDecision(b, tampered);
    expect(out.status).toBe("MISMATCH");
    expect(out.recommendationMatch).toBe(true);
    expect(out.predicatePictureMatch).toBe(false);
  });

  it("UNSUPPORTED_EVALUATOR_VERSION: an unknown historical version is reported, not re-run", () => {
    const b = bundle({ evaluatorVersion: "99" });
    const out = replayDecision(b, persistedFor(bundle()));
    expect(out.status).toBe("UNSUPPORTED_EVALUATOR_VERSION");
    expect(out.recomputed).toBeNull();
  });

  it("replay uses ONLY the recovered bundle — stable across calls (anti-hindsight)", () => {
    const b = bundle();
    const p = persistedFor(b);
    expect(replayDecision(b, p).recomputed).toBe(replayDecision(b, p).recomputed);
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
