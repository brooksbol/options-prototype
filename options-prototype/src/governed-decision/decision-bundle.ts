/**
 * Canonical replay-bound Decision bundle (P2) + deterministic identity (P2/P3).
 *
 * A Lifecycle Decision Record (ADR-019) must preserve the EXACT values the evaluator
 * consumed, so P3 replay can reproduce the Recommendation from recovered inputs without
 * consulting current state. This module defines that canonical bundle and its
 * deterministic identity/hash.
 *
 * The bundle is strategy-family-neutral at the storage boundary (it carries Wheel values
 * as opaque fields; the shared substrate does not "understand" LET_RESOLVE/SELL_CALL).
 */

import type { GovernedContextVersion } from "./governed-context";
import type { DecisionSubject } from "./subject";
import type {
  CoveredCallFacts,
  ShareBlockFacts,
} from "./evaluators";
import type { EvaluatorId, GovernedRecommendation, RuleId } from "./types";

/**
 * Evidence provenance carried with a Decision (ADR-015). Distinct from governance
 * provenance: this describes the market/portfolio evidence the evaluator consumed.
 */
export interface DecisionEvidenceProvenance {
  /** Ownership authority behind share/coverage facts (ADR-020), when applicable. */
  ownershipAuthority: "positions" | "option-summary" | null;
  /** Option Summary checkpoint timestamp used, or null. ISO8601. */
  optionSummaryCheckpoint: string | null;
  /** Evidence snapshot generation consumed, or null. */
  evidenceGeneration: number | null;
}

/** The exact consumed facts, discriminated by subject type. */
export type ConsumedFacts =
  | { kind: "covered-call"; facts: CoveredCallFacts }
  | { kind: "share-block"; facts: ShareBlockFacts };

/**
 * The canonical replay-bound bundle. Every field here is what the evaluator consumed
 * at the decision boundary; replay recovers these and re-runs the pinned evaluator
 * version. `associationEstablished` is included because it is a load-bearing input.
 */
export interface DecisionInputBundle {
  brokerageAccountId: string;
  subject: DecisionSubject;
  governedScopeId: string;
  /** The pinned Context Version consumed (full immutable content, not just an id). */
  contextVersion: GovernedContextVersion;
  associationEstablished: boolean;
  consumed: ConsumedFacts;
  evidenceProvenance: DecisionEvidenceProvenance;
  ruleId: RuleId;
  evaluatorId: EvaluatorId;
  evaluatorVersion: string;
  /** Decision time (when the evaluation was made). ISO8601. */
  decisionTime: string;
}

/** The immutable Decision result persisted alongside the bundle. */
export interface DecisionResult {
  recommendation: GovernedRecommendation;
  reasons: { text: string; basis: string }[];
  unresolvedCauses: string[];
}

/**
 * Deterministic, order-stable canonical serialization of the bundle for identity and
 * integrity. Uses explicit ordered keys with a length-prefixed encoding so no field can
 * alias another (avoids lossy delimiter collisions). Not cryptographic; adequate for
 * idempotency + integrity detection within the trusted single-operator boundary.
 */
export function canonicalizeBundle(b: DecisionInputBundle): string {
  const cv = b.contextVersion;
  const parts: (string | number | boolean | null)[] = [
    "v1",
    b.brokerageAccountId,
    b.subject.subjectType,
    b.subject.subjectId,
    b.subject.symbol,
    b.governedScopeId,
    cv.contextVersionId,
    cv.version,
    cv.program.program,
    cv.program.configVersion,
    cv.callAwayStance,
    cv.eligibilityGate,
    cv.interventionGate,
    cv.noWriteGate,
    cv.authorityProvenance,
    cv.effectiveFrom,
    b.associationEstablished,
    b.consumed.kind,
    ...serializeConsumed(b.consumed),
    b.evidenceProvenance.ownershipAuthority,
    b.evidenceProvenance.optionSummaryCheckpoint,
    b.evidenceProvenance.evidenceGeneration,
    b.ruleId,
    b.evaluatorId,
    b.evaluatorVersion,
    b.decisionTime,
  ];
  // Length-prefixed encoding: <len>:<value> per part, so concatenation is injective.
  return parts
    .map((p) => {
      const s = p == null ? "\u0000" : String(p);
      return `${s.length}:${s}`;
    })
    .join("|");
}

function serializeConsumed(c: ConsumedFacts): (string | number | boolean | null)[] {
  if (c.kind === "covered-call") {
    return [c.facts.callIsCurrent, c.facts.coverageEstablished, c.facts.evidenceSufficient];
  }
  return [c.facts.freeShares, c.facts.ownershipAuthority, c.facts.evidenceSufficient];
}

/** FNV-1a 32-bit -> base36 over the canonical string. Deterministic; not cryptographic. */
export function bundleHash(b: DecisionInputBundle): string {
  const input = canonicalizeBundle(b);
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return "db_" + (h >>> 0).toString(36);
}

/**
 * Deterministic Decision identity. Two evaluations that consumed byte-identical inputs
 * (same bundle hash) are the same Decision -> backend INSERT OR IGNORE dedups. A changed
 * consumed input, context version, evaluator version, or decision time yields a new id.
 */
export function decisionId(b: DecisionInputBundle): string {
  return "dec_" + bundleHash(b).slice(3);
}
