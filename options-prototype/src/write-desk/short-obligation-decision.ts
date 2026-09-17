/**
 * Governed Short-Obligation Lifecycle DECISION (the DECIDE layer).
 *
 * Governing authority: `LVT-BET-LIFECYCLE-POLICY` → `LVT-INIT-POLICY-TAKE-PROFIT`
 * ("Establish governed BTC/take-profit behavior"); AR5 (Eligibility →
 * Acceptability → Comparative Fitness); Policy over Prediction.
 *
 * CAPABILITY POSITION (Principal-directed four-layer model):
 *   NOTICE   — which positions matter (btc-review-candidate.ts).
 *   EVALUATE — per-fact consequences (short-obligation-consequences.ts).
 *   DECIDE   — THIS module: given governed policy + supported evidence, what
 *              should the operator DO with this position?
 *   EXPLAIN  — the reasons, presented answer-first (UI).
 *
 * This is a GOVERNED POLICY result, not a prediction, not an LLM improvisation,
 * and NOT an automatic trade. Wheelwright states the action; the operator
 * executes it through the existing broker handoff (ADR-004 preserved). The
 * decision is transparent and rule-traceable (Policy over Prediction): every
 * reason names the supported evidence that produced it.
 *
 * INVARIANT WHEELWRIGHT-OPERATOR-EFFICIENCY: when governed policy + supported
 * evidence can establish the action, state the action directly. Do not force the
 * operator to synthesize raw facts to discover a simple decision.
 *
 * INVARIANT BTS-CLOSURE-INDEPENDENCE: market/session closure or chain
 * inadmissibility must never, by itself, erase the governed action. It may make
 * the executable close price unavailable (a secondary execution caveat) — UNLESS
 * the governing policy itself requires current close price as a decision input,
 * in which case the decision is explicitly DEFERRED (not fabricated, not erased).
 */

import type { BtcReviewDetection } from "./btc-review-candidate";

/** The governed lifecycle action. Operator-executed, never auto-placed. */
export type LifecycleAction =
  | "BTC"                  // buy-to-close the short obligation now
  | "HOLD"                 // governed HOLD is the result (nothing clears a close gate)
  | "RECONCILE-LIFECYCLE"  // subject-level blocker: cannot safely establish an action
  | "NO-ACTION"            // not a candidate / no lifecycle action warranted now
  | "DECISION-DEFERRED";   // policy needs an input it currently lacks

/** Supported decision inputs (each must stand on its own evidence). */
export interface LifecycleDecisionInputs {
  side: "put" | "call";
  /** Days to expiration (subject state). */
  dte: number;
  /**
   * Signed moneyness (positive = ITM, negative = OTM), from a SUPPORTED
   * underlying observation. Null when not supported — then the moneyness-based
   * disposition cannot be established from this input.
   */
  moneyness: number | null;
  /**
   * NOTICE result for this obligation (contract-state candidate detection).
   * Governs whether the obligation is even in scope for a lifecycle action.
   */
  candidate: BtcReviewDetection;
  /**
   * Whether current close-price evidence is SUPPORTED (admissible + usable). Used
   * ONLY to decide the execution caveat and, for policies that require it, to
   * DEFER. It never, by itself, erases an action the policy can otherwise reach.
   */
  closePriceSupported: boolean;
}

/** A governed reason, naming the supported evidence that produced it. */
export interface GovernedReason {
  text: string;
  /** The evidence dependency this reason stands on (audit trail). */
  evidence: "dte" | "moneyness" | "candidate" | "policy";
}

export interface LifecycleDecision {
  action: LifecycleAction;
  /** Operator-facing headline. e.g. "BTC THIS PUT" / "HOLD". */
  headline: string;
  /**
   * Whether this decision REQUIRES the operator to DO something now — the
   * ATTENTION layer, DISTINCT from DECIDE and the sole driver of the red row
   * indicator. It is a function of the ACTION, not of "a decision was reached":
   * a routine HOLD (keep doing exactly what the operator is already doing) is a
   * governed decision but is NOT an operator action, so it carries NO attention
   * and NO red row indicator. Derived by `actionRequiresOperator`.
   */
  attention: boolean;
  /** Concise governed reasons (smallest useful supporting set). */
  reasons: GovernedReason[];
  /**
   * Secondary execution caveat, present when the action stands but the
   * executable close price is currently unavailable. Never replaces the action.
   */
  executionCaveat: string | null;
}

/**
 * Provisional governed policy parameters (declared, observable, adjustable — NOT
 * a prediction and NOT invented thresholds smuggled as certainty). These express
 * the precommitted lifecycle policy under `LVT-INIT-POLICY-TAKE-PROFIT`.
 */
export interface LifecyclePolicy {
  /** Near-term horizon: at/under this DTE a candidate's disposition is decided now. */
  nearDteMax: number;
  /**
   * OTM magnitude at/above which a near-DTE short's remaining obligation risk is
   * governed as negligible → BTC/close-out-the-tail disposition (let-expire is the
   * alternative, but the governed default surfaces BTC as the actionable step the
   * operator can take now to retire residual risk/assignment tail).
   */
  negligibleRiskOtmMagnitude: number;
  /**
   * Whether the governed BTC disposition REQUIRES a current close price to be
   * decided. For the negligible-risk tail disposition it does NOT (the decision
   * rests on proximity + moneyness); the close price is an execution detail. A
   * take-profit-percentage policy WOULD set this true (→ DEFER when unsupported).
   */
  btcRequiresClosePrice: boolean;
}

/**
 * Provisional defaults. DTE ≤ 5 near-term; |OTM| ≥ 15% negligible remaining risk
 * for a near-DTE short; the negligible-risk BTC disposition does not require a
 * current close price to be decided (execution detail only). No symbol/strike/
 * date specifics; no recommendation of a fill price.
 */
export const DEFAULT_LIFECYCLE_POLICY: LifecyclePolicy = Object.freeze({
  nearDteMax: 5,
  negligibleRiskOtmMagnitude: 0.15,
  btcRequiresClosePrice: false,
});

const EXECUTION_CAVEAT =
  "Current BTC price unavailable — obtain a live quote before execution.";

/**
 * The ATTENTION rule (Principal-ratified): the red BTS indicator is an
 * EXCEPTION / operator-action signal, NOT an "evaluation completed" or "a
 * decision exists" signal. It is true ONLY for actions that require the operator
 * to DO something now:
 *   - BTC                  — retire the obligation (an action).
 *   - RECONCILE-LIFECYCLE  — the operator must reconcile authoritative state.
 *   - DECISION-DEFERRED    — the operator must supply the missing input.
 * It is FALSE for:
 *   - HOLD      — continue exactly what the operator is already doing; useful
 *                 information in the modal, but not an urgent row alert.
 *   - NO-ACTION — nothing to do.
 *
 * Strategy type, DTE, or evaluation eligibility ALONE never imply attention.
 */
export function actionRequiresOperator(action: LifecycleAction): boolean {
  switch (action) {
    case "BTC":
    case "RECONCILE-LIFECYCLE":
    case "DECISION-DEFERRED":
      return true;
    case "HOLD":
    case "NO-ACTION":
      return false;
  }
}

/**
 * Establish the governed lifecycle action for one existing short obligation.
 * Pure, deterministic, and traceable to the policy rule that fired.
 */
export function decideShortObligationLifecycle(
  inputs: LifecycleDecisionInputs,
  policy: LifecyclePolicy = DEFAULT_LIFECYCLE_POLICY
): LifecycleDecision {
  // Subject-level blocker: cannot even confirm the obligation is current (§14a).
  // We do NOT fabricate a BTC/HOLD; we tell the operator to reconcile.
  if (inputs.candidate === "lifecycle-ambiguous") {
    return {
      action: "RECONCILE-LIFECYCLE",
      headline: "RECONCILE LIFECYCLE",
      attention: actionRequiresOperator("RECONCILE-LIFECYCLE"),
      reasons: [{
        text: "Authoritative brokerage Activity conflicts with the projected open obligation; the position's current lifecycle state cannot be safely established.",
        evidence: "candidate",
      }],
      executionCaveat: null,
    };
  }

  // Not a review candidate → no governed lifecycle action warranted now.
  if (inputs.candidate !== "candidate") {
    return {
      action: "NO-ACTION",
      headline: "NO ACTION NEEDED",
      attention: actionRequiresOperator("NO-ACTION"),
      reasons: [{ text: "No lifecycle action is warranted for this position right now.", evidence: "candidate" }],
      executionCaveat: null,
    };
  }

  const side = inputs.side;
  const label = side === "put" ? "PUT" : "CALL";
  const m = inputs.moneyness;
  const nearDte = Number.isFinite(inputs.dte) && inputs.dte <= policy.nearDteMax;

  // The governed BTC/close-tail disposition: near-DTE + deeply-OTM short ⇒ the
  // remaining obligation risk is governed negligible; the operator can retire the
  // residual assignment/expiration tail by buying it to close now. This decision
  // rests on SUBJECT + UNDERLYING evidence (DTE + moneyness) — NOT on the close
  // quote — so chain inadmissibility does not erase it (BTS-CLOSURE-INDEPENDENCE).
  if (nearDte && m != null && m < 0 && Math.abs(m) >= policy.negligibleRiskOtmMagnitude) {
    // If (and only if) the governing policy requires a current close price to
    // decide, and it is unsupported, DEFER — explicitly, never fabricated.
    if (policy.btcRequiresClosePrice && !inputs.closePriceSupported) {
      return {
        action: "DECISION-DEFERRED",
        headline: "DECISION DEFERRED",
        attention: actionRequiresOperator("DECISION-DEFERRED"),
        reasons: [
          { text: `${inputs.dte} DTE · deeply OTM`, evidence: "moneyness" },
          { text: "Governed BTC policy requires a current close price, which is not available this session.", evidence: "policy" },
        ],
        executionCaveat: "Obtain a live quote to establish the governed decision.",
      };
    }
    const reasons: GovernedReason[] = [
      { text: `${inputs.dte} DTE`, evidence: "dte" },
      { text: `deeply OTM (${(Math.abs(m) * 100).toFixed(1)}% from strike)`, evidence: "moneyness" },
      { text: "remaining obligation risk governed negligible — BTC policy condition met", evidence: "policy" },
    ];
    return {
      action: "BTC",
      headline: `BTC THIS ${label}`,
      attention: actionRequiresOperator("BTC"),
      reasons,
      // Chain inadmissibility/closure degrades ONLY this execution figure.
      executionCaveat: inputs.closePriceSupported ? null : EXECUTION_CAVEAT,
    };
  }

  // Candidate detected but moneyness posture not established (e.g. no supported
  // underlying observation) → cannot establish the disposition from this input;
  // DEFER rather than assert a HOLD/BTC we cannot support. (Checked before the
  // near-DTE HOLD branch so an unestablished moneyness is never silently HELD.)
  if (m == null) {
    return {
      action: "DECISION-DEFERRED",
      headline: "DECISION DEFERRED",
      attention: actionRequiresOperator("DECISION-DEFERRED"),
      reasons: [{ text: "Current moneyness is not established from a supported underlying observation.", evidence: "moneyness" }],
      executionCaveat: null,
    };
  }

  // Near-DTE candidate that does NOT meet the negligible-risk BTC condition
  // (ITM / near-strike / mid-OTM): governed HOLD is the result — the operator is
  // told HOLD directly, not handed a generic comparison. (Assignment-review
  // framing and consequence detail remain available beneath.)
  // A candidate whose posture does not meet the negligible-risk BTC condition
  // (ITM / near-strike / mid-OTM), with moneyness established: governed HOLD is
  // the result — the operator is told HOLD directly, not handed a generic
  // comparison. (Assignment-review framing + consequence detail remain beneath.)
  return {
    action: "HOLD",
    headline: "HOLD",
    // A routine HOLD is a governed decision but NOT an operator action → NO red.
    attention: actionRequiresOperator("HOLD"),
    reasons: [
      { text: `${inputs.dte} DTE`, evidence: "dte" },
      {
        text: m >= 0
          ? "in/at the money — resolution direction live; no governed close condition met"
          : "near strike — resolution direction live; no governed close condition met",
        evidence: "moneyness",
      },
    ],
    executionCaveat: null,
  };
}
