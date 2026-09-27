/**
 * Operator-control admissibility gate (ADR-021 §4 / Doc 67 §6).
 *
 * A UI may render an ENABLED mutating control for a predicate ONLY when the complete
 * authority chain exists: defined semantic fact → authorized operator authority → resolved
 * subject/scope identity → durable append/version contract → known evaluator consumer →
 * deterministic reevaluation → replay-bound Decision.
 *
 * This module is the single, testable gate. Predicate status alone NEVER enables a control.
 * A resolution affordance is admissible only when it advertises `availability: "available"`
 * AND carries a non-null `capabilityId` registered in the admissible-capability manifest.
 *
 * CURRENT SLICE (ADR-021 / Doc 67 §7,§8,§9): no mutating capability is admissible.
 *   - Wheel-scope establishment: configuration selection + Product-language creation
 *     semantics are unratified (PROGRAM_CONFIGURATION unavailable).
 *   - Retrospective pre-acceptance attestation: depends on an established scope; unavailable.
 *   - Undefined intervention/eligibility/no-write policy: resolvable only by new authority.
 * The manifest is therefore empty. Adding a capability here is the ONLY way to make a
 * control admissible, which keeps the invariant honest and centrally reviewable.
 */

import type { PredicateResult, ResolutionAffordance } from "./predicate";

/**
 * The set of capability ids for which a complete, durable, reevaluating operator-control
 * chain currently exists. EMPTY in this slice by ratified authority. A capability may be
 * added ONLY when every §6 link is real (write contract + consumer + reevaluation + replay).
 */
export const ADMISSIBLE_CONTROL_CAPABILITIES: ReadonlySet<string> = new Set<string>([
  // ATTACH TO… (Doc 69 walking slice): establishing that a bounded covered-call subject
  // participates in Assignment-Centric Wheel v1. The complete §6 chain is real —
  // defined question/answer (attach vs not), operator authority (operator-governance),
  // resolved bounded subject/scope identity (system-minted scope from the bounded
  // covered-call subjectId), durable atomic append (POST /api/governed-context/attach),
  // known evaluator consumer (wheel-membership predicate), deterministic reevaluation
  // (governanceEpoch bump), and replay-bound Decision. It ONLY establishes membership;
  // stance/eligibility/no-write/intervention remain unresolved/undefined.
  "attach-assignment-centric-wheel",
]);

/** Whether a single resolution affordance is an admissible enabled control right now. */
export function isAffordanceAdmissible(a: ResolutionAffordance): boolean {
  return (
    a.availability === "available" &&
    a.capabilityId != null &&
    ADMISSIBLE_CONTROL_CAPABILITIES.has(a.capabilityId)
  );
}

/**
 * The admissible control capability for a predicate, or null when none exists. When null,
 * the drawer must explain the status/blocker but must NOT render an enabled answer control.
 */
export function admissibleControlFor(p: PredicateResult): string | null {
  for (const a of p.resolution) {
    if (isAffordanceAdmissible(a)) return a.capabilityId;
  }
  return null;
}
