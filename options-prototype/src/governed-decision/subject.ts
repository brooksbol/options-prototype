/**
 * Decision Subject identity and evidence-backed scope association
 * (Candidate B, Correction 3).
 *
 * A Decision Subject is the exact thing a governed Decision is about. Two subject
 * classes exist in this slice:
 *   - "covered-call"  — an existing short call authoritatively covered by owned shares.
 *   - "share-block"   — an authoritatively unencumbered 100-share block.
 *
 * ASSOCIATION IS EVIDENCE-BACKED (Correction 3): a subject may consume a governed
 * scope ONLY when the association is explicitly established. Sameness of account /
 * ticker / shares / apparent Wheel mechanics / buy-write provenance NEVER proves
 * continuity. If the association cannot be established, the evaluator returns
 * UNRESOLVED — governance is never copied because a symbol matches.
 */

export type SubjectType = "covered-call" | "share-block";

/**
 * Stable Decision Subject identity. For covered calls this reuses the Console
 * `MonitoredPosition.id` convention (`call-<underlying>-<strike>-<expiration>`); for
 * share blocks it is `shares-<symbol>` scoped by account at the Decision level.
 */
export interface DecisionSubject {
  subjectType: SubjectType;
  subjectId: string;
  symbol: string;
  brokerageAccountId: string;
}

/**
 * An explicit, authoritative association of a Decision Subject to a governed scope.
 * This is the durable claim (ADR-016) that "this subject belongs to that scope."
 * `provenance` distinguishes an operator-authored binding from a broker-evidence-backed
 * successor recognition. It is NEVER "derived from symbol equality."
 */
export interface SubjectScopeAssociation {
  brokerageAccountId: string;
  subjectId: string;
  governedScopeId: string;
  /** How the association was established. */
  provenance: "operator-governance" | "broker-evidence";
  /** Effective time of the association. ISO8601. */
  effectiveFrom: string;
}

/**
 * Resolve the governed scope for a subject from a set of explicit associations.
 * Returns null when no explicit association exists — the caller MUST then fail closed
 * to UNRESOLVED rather than guess. There is deliberately no ticker/heuristic fallback.
 */
export function resolveScopeForSubject(
  subject: DecisionSubject,
  associations: readonly SubjectScopeAssociation[],
): SubjectScopeAssociation | null {
  const matches = associations.filter(
    (a) =>
      a.brokerageAccountId === subject.brokerageAccountId &&
      a.subjectId === subject.subjectId,
  );
  if (matches.length === 0) return null;
  // Most recent effective association wins (governance can be re-associated over time).
  return matches.reduce((latest, a) =>
    Date.parse(a.effectiveFrom) >= Date.parse(latest.effectiveFrom) ? a : latest,
  );
}
