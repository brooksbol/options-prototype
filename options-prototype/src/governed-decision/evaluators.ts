/**
 * Bounded governed evaluators (ADR-021 rewrite of P0).
 *
 * Two pure, deterministic evaluators implementing the Doc 65 bounded rules. Under ADR-021
 * each returns the COMPLETE ordered predicate picture (not a first-blocker cause), using the
 * canonical eight-state taxonomy, with rule-local dependency ordering: independent
 * mechanical/evidence predicates are evaluated even when governance predicates fail;
 * dependent predicates emit NOT_EVALUATED (with `blockedBy`) when a prerequisite is absent.
 *
 * INVARIANTS (ADR-021 / Doc 67):
 *   - No affirmative Recommendation from mechanical facts alone.
 *   - The Recommendation is DERIVED from the predicate picture only inside the evaluator.
 *   - Missing membership authority => AUTHORITY_MISSING (not UNKNOWN, not a negative).
 *   - Authoritative negative membership => NOT_SATISFIED + programApplicability "outside-program".
 *   - Intervention / eligibility / no-write conditions have no ratified policy =>
 *     POLICY_UNDEFINED (never silently UNKNOWN/CLEAR). They may block affirmative outcomes.
 *   - Historical call-away pre-acceptance is a distinct fact from present desire; absent an
 *     attestation it is AUTHORITY_MISSING; when membership is absent it is NOT_EVALUATED.
 *   - No import of the provisional BTC/HOLD evaluator. No HOLD -> LET_RESOLVE.
 *   - `SELL_CALL` is a PHASE result; it never selects a contract.
 */

import type { GovernedContextVersion } from "./governed-context";
import type {
  EvaluatorId,
  GovernedEvaluation,
  GovernedReason,
  ProgramApplicability,
} from "./types";
import { EVALUATOR_VERSION } from "./types";
import type { PredicateResult, ResolutionAffordance } from "./predicate";
import { predicate, notEvaluated } from "./predicate";

/** Authoritative mechanical/evidence facts for a covered-call subject. */
export interface CoveredCallFacts {
  callIsCurrent: boolean;
  coverageEstablished: boolean;
  evidenceSufficient: boolean;
}

/** Authoritative mechanical/evidence facts for a share-block subject. */
export interface ShareBlockFacts {
  freeShares: number;
  ownershipAuthority: "positions" | "option-summary" | null;
  evidenceSufficient: boolean;
}

/**
 * Inputs common to both evaluators: the applicable Context Version (already resolved for
 * the subject via an explicit association) or null when no governed context / association
 * is applicable, plus whether an explicit association was resolved.
 *
 * `membershipNegative` (ADR-021 §5): an AUTHORITATIVE negative membership assertion — the
 * subject is explicitly attested to be OUTSIDE this Program. Distinct from "no association"
 * (AUTHORITY_MISSING). Absent unless durable negative governance exists.
 */
export interface GovernedInputsBase {
  context: GovernedContextVersion | null;
  associationEstablished: boolean;
  /** Authoritative negative Program membership (explicit), when established. */
  membershipNegative?: boolean;
}

// --- Resolution affordances (derived metadata; never themselves enable a control) ---

/**
 * Membership resolution. Per Doc 67 §7, the operator-facing scope-establishment control's
 * complete admissibility chain does NOT yet exist (configuration selection + Product-language
 * creation semantics are unratified). So the advertised mechanism is PROGRAM_CONFIGURATION
 * with availability "unavailable": the picture explains what would resolve it, but no enabled
 * control is offered. `capabilityId` is null precisely because no admissible capability exists.
 */
const MEMBERSHIP_RESOLUTION: ResolutionAffordance[] = [
  {
    mode: "PROGRAM_CONFIGURATION",
    availability: "unavailable",
    capabilityId: null,
    explanation:
      "Establishing that this position belongs to a governed Wheel program requires selecting " +
      "a ratified program configuration and creating a governed scope. That operator setup path " +
      "is not yet available in this slice.",
  },
];

/** Undefined policy: only new Principal/Product authority (then implementation) can resolve it. */
const POLICY_UNDEFINED_RESOLUTION: ResolutionAffordance[] = [
  {
    mode: "PRINCIPAL_AUTHORITY",
    availability: "unavailable",
    capabilityId: null,
    explanation:
      "This condition has no ratified governing policy yet, so it cannot be answered as a fact. " +
      "It stays unresolved until the policy is defined.",
  },
];

/** Historical pre-acceptance: an authorized retrospective operator attestation could resolve it. */
const PREACCEPTANCE_RESOLUTION: ResolutionAffordance[] = [
  {
    mode: "OPERATOR_GOVERNANCE",
    availability: "unavailable",
    capabilityId: null,
    explanation:
      "Whether call-away was pre-accepted when this call was opened is a historical governance " +
      "fact. The attestation control depends on an established governed scope and is not yet " +
      "available in this slice.",
  },
];

/** Ownership/coverage evidence is resolvable by authoritative broker evidence (already used). */
const EVIDENCE_RESOLUTION: ResolutionAffordance[] = [
  { mode: "AUTHORITATIVE_EVIDENCE", availability: "available", capabilityId: "broker-positions-evidence" },
];

/** Derive the public Recommendation from the complete predicate picture (evaluator-only). */
function deriveRecommendation(
  affirmative: GovernedEvaluation["recommendation"],
  predicates: PredicateResult[],
): GovernedEvaluation["recommendation"] {
  // Affirmative only when EVERY relevant predicate is SATISFIED or NOT_APPLICABLE.
  const allClear = predicates.every(
    (p) => p.status === "SATISFIED" || p.status === "NOT_APPLICABLE",
  );
  return allClear ? affirmative : "UNRESOLVED";
}

/** Compatibility summary: reasons + unresolvedCauses derived from the picture. */
function summarize(predicates: PredicateResult[]): {
  reasons: GovernedReason[];
  unresolvedCauses: string[];
} {
  const reasons: GovernedReason[] = predicates.map((p) => ({
    text: `${p.label}: ${p.reason}`,
    basis: "context",
  }));
  const unresolvedCauses = predicates
    .filter((p) => p.status !== "SATISFIED" && p.status !== "NOT_APPLICABLE")
    .map((p) => p.key);
  return { reasons, unresolvedCauses };
}

/**
 * Rule 1 — existing governed covered call => LET_RESOLVE | UNRESOLVED (+ applicability).
 *
 * Predicate order (rule-local): coverage/currency/evidence (independent mechanical),
 * then membership (authority), then call-away pre-acceptance + continuing effectiveness
 * (depend on membership), then intervention policy (POLICY_UNDEFINED).
 */
export function evaluateCoveredCall(
  facts: CoveredCallFacts,
  inputs: GovernedInputsBase,
): GovernedEvaluation {
  const evaluatorId: EvaluatorId = "wheel-covered-call";
  const ruleId = "DOC65-RULE-1-LET-RESOLVE" as const;
  const P: PredicateResult[] = [];

  // Independent mechanical/evidence predicates — evaluated regardless of governance.
  P.push(
    facts.callIsCurrent
      ? predicate("covered-call-current", "Covered call is current", "SATISFIED",
          "The short call is present in authoritative reconciled state.")
      : predicate("covered-call-current", "Covered call is current", "NOT_SATISFIED",
          "The short call is not confirmed current in authoritative state."),
  );
  P.push(
    facts.coverageEstablished
      ? predicate("coverage", "Share coverage", "SATISFIED",
          "Owned shares authoritatively cover the short call (ADR-020).", EVIDENCE_RESOLUTION)
      : predicate("coverage", "Share coverage", "EVIDENCE_INSUFFICIENT",
          "Authoritative ownership does not yet establish coverage for this short call.", EVIDENCE_RESOLUTION),
  );
  P.push(
    facts.evidenceSufficient
      ? predicate("evidence", "Decision evidence", "SATISFIED", "Required decision evidence is authoritative.", EVIDENCE_RESOLUTION)
      : predicate("evidence", "Decision evidence", "EVIDENCE_INSUFFICIENT", "Required decision evidence is not yet authoritative.", EVIDENCE_RESOLUTION),
  );

  // Membership / association (authority). Distinguish negative vs missing.
  const applicability: ProgramApplicability = inputs.membershipNegative ? "outside-program" : "applicable";
  const membershipEstablished = inputs.associationEstablished && !!inputs.context && !inputs.membershipNegative;
  if (inputs.membershipNegative) {
    P.push(predicate("wheel-membership", "Wheel program membership", "NOT_SATISFIED",
      "This position is authoritatively attested to be outside the Wheel program; the rule does not apply."));
  } else if (membershipEstablished) {
    P.push(predicate("wheel-membership", "Wheel program membership", "SATISFIED",
      "This position is associated with a governed Wheel scope."));
  } else {
    P.push(predicate("wheel-membership", "Wheel program membership", "AUTHORITY_MISSING",
      "WW has not been told this position is part of a governed Wheel program; it will not infer membership.",
      MEMBERSHIP_RESOLUTION));
  }

  // Call-away historical pre-acceptance (depends on membership). Doc 65 Rule 1 requires it.
  if (!membershipEstablished) {
    P.push(notEvaluated("call-away-preacceptance", "Call-away pre-acceptance", ["wheel-membership"],
      "Not evaluated: depends on established Wheel membership."));
    P.push(notEvaluated("call-away-effective", "Call-away stance still effective", ["wheel-membership"],
      "Not evaluated: depends on established Wheel membership."));
  } else {
    // Membership exists. Historical pre-acceptance is a distinct fact; the current context's
    // callAwayStance is NOT that historical attestation (ADR-021 §6 / Doc 67 §8). Absent an
    // explicit retrospective attestation it is AUTHORITY_MISSING.
    const attested = inputs.context!.callAwayStance === "accepted";
    P.push(
      attested
        ? predicate("call-away-preacceptance", "Call-away pre-acceptance", "SATISFIED",
            "Call-away was attested as pre-accepted when the call was opened.")
        : predicate("call-away-preacceptance", "Call-away pre-acceptance", "AUTHORITY_MISSING",
            "It is not established that call-away was pre-accepted when this call was opened.",
            PREACCEPTANCE_RESOLUTION),
    );
    P.push(
      attested
        ? predicate("call-away-effective", "Call-away stance still effective", "SATISFIED",
            "The pre-accepted call-away disposition remains effective.")
        : notEvaluated("call-away-effective", "Call-away stance still effective", ["call-away-preacceptance"],
            "Not evaluated: depends on established pre-acceptance."),
    );
  }

  // Intervention policy — no ratified policy (ADR-021 §8). Always POLICY_UNDEFINED here.
  P.push(predicate("intervention-policy", "Intervention condition", "POLICY_UNDEFINED",
    "WW has no ratified policy defining an intervention condition for this position, so it cannot be evaluated.",
    POLICY_UNDEFINED_RESOLUTION));

  const recommendation = deriveRecommendation("LET_RESOLVE", P);
  const { reasons, unresolvedCauses } = summarize(P);
  return {
    recommendation,
    evaluatorId,
    evaluatorVersion: EVALUATOR_VERSION[evaluatorId],
    ruleId,
    predicateResults: P,
    programApplicability: applicability,
    reasons,
    unresolvedCauses,
  };
}

/**
 * Rule 2 — eligible unencumbered Wheel shares => SELL_CALL | UNRESOLVED (+ applicability).
 *
 * SELL_CALL is a phase Recommendation; it does not select a contract.
 */
export function evaluateSharePhase(
  facts: ShareBlockFacts,
  inputs: GovernedInputsBase,
): GovernedEvaluation {
  const evaluatorId: EvaluatorId = "wheel-share-phase";
  const ruleId = "DOC65-RULE-2-SELL-CALL" as const;
  const P: PredicateResult[] = [];

  // Independent mechanical/evidence predicates.
  P.push(
    facts.freeShares >= 100
      ? predicate("free-lot", "Free 100-share lot", "SATISFIED", `${facts.freeShares} free shares establish at least one writable lot.`, EVIDENCE_RESOLUTION)
      : predicate("free-lot", "Free 100-share lot", "NOT_SATISFIED", "Fewer than 100 free shares; no writable lot.", EVIDENCE_RESOLUTION),
  );
  P.push(
    facts.ownershipAuthority != null
      ? predicate("ownership-evidence", "Ownership evidence", "SATISFIED", `Ownership is authoritative (${facts.ownershipAuthority}).`, EVIDENCE_RESOLUTION)
      : predicate("ownership-evidence", "Ownership evidence", "EVIDENCE_INSUFFICIENT", "Authoritative ownership evidence is not available.", EVIDENCE_RESOLUTION),
  );
  P.push(
    facts.evidenceSufficient
      ? predicate("evidence", "Decision evidence", "SATISFIED", "Required decision evidence is authoritative.", EVIDENCE_RESOLUTION)
      : predicate("evidence", "Decision evidence", "EVIDENCE_INSUFFICIENT", "Required decision evidence is not yet authoritative.", EVIDENCE_RESOLUTION),
  );

  // Membership / association.
  const applicability: ProgramApplicability = inputs.membershipNegative ? "outside-program" : "applicable";
  const membershipEstablished = inputs.associationEstablished && !!inputs.context && !inputs.membershipNegative;
  if (inputs.membershipNegative) {
    P.push(predicate("wheel-membership", "Wheel program membership", "NOT_SATISFIED",
      "This share block is authoritatively attested to be outside the Wheel program; the rule does not apply."));
  } else if (membershipEstablished) {
    P.push(predicate("wheel-membership", "Wheel program membership", "SATISFIED",
      "This share block is associated with a governed Wheel scope."));
  } else {
    P.push(predicate("wheel-membership", "Wheel program membership", "AUTHORITY_MISSING",
      "WW has not been told this share block is part of a governed Wheel program; it will not infer membership.",
      MEMBERSHIP_RESOLUTION));
  }

  // Call-away acceptance (depends on membership).
  if (!membershipEstablished) {
    P.push(notEvaluated("call-away-accepted", "Call-away accepted", ["wheel-membership"],
      "Not evaluated: depends on established Wheel membership."));
  } else {
    const attested = inputs.context!.callAwayStance === "accepted";
    P.push(
      attested
        ? predicate("call-away-accepted", "Call-away accepted", "SATISFIED", "Call-away is an accepted disposition for this Wheel inventory.")
        : predicate("call-away-accepted", "Call-away accepted", "AUTHORITY_MISSING",
            "It is not established that call-away is an accepted disposition for this inventory.", PREACCEPTANCE_RESOLUTION),
    );
  }

  // Eligibility + no-write policies — unratified (ADR-021 §8). Always POLICY_UNDEFINED here.
  P.push(predicate("eligibility-policy", "Program eligibility", "POLICY_UNDEFINED",
    "WW has no ratified stock-eligibility policy for this Wheel phase, so it cannot be evaluated.",
    POLICY_UNDEFINED_RESOLUTION));
  P.push(predicate("no-write-policy", "No-write condition", "POLICY_UNDEFINED",
    "WW has no ratified no-write policy for this phase, so it cannot be evaluated.",
    POLICY_UNDEFINED_RESOLUTION));

  const recommendation = deriveRecommendation("SELL_CALL", P);
  const { reasons, unresolvedCauses } = summarize(P);
  return {
    recommendation,
    evaluatorId,
    evaluatorVersion: EVALUATOR_VERSION[evaluatorId],
    ruleId,
    predicateResults: P,
    programApplicability: applicability,
    reasons,
    unresolvedCauses,
  };
}
