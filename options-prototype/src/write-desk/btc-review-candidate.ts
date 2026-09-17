/**
 * BTC-Review Candidate Detection (BTS attention layer).
 *
 * Governing authority: ADR-013 "Decision Pressure" (resolution-approaching →
 * operator awareness warranted, derived from resolution proximity = current DTE
 * + current moneyness magnitude; situation-independent; requires NO admissible
 * option-chain quote) and `LVT-BET-ATTENTION` / `LVT-INIT-ATTN-MODEL`; AR2
 * (Attention is a distinct responsibility from decision/consequence).
 *
 * CAPABILITY SEPARATION (the reconciled model — Principal-directed):
 *   A. Candidate DETECTION (this module) — "does this existing obligation's
 *      current lifecycle/economic posture warrant operator review for a
 *      lifecycle action such as BTC?" Drives the red BTS attention indicator.
 *   B. Alternative set — HOLD / CLOSE (elsewhere).
 *   C. Consequence evaluation — what can be established per alternative NOW
 *      (elsewhere; chain admissibility degrades individual facts there).
 *   D. Judgment/recommendation — ABSENT.
 *
 * CRITICAL BOUNDARY: detection is derived ONLY from contract-state evidence
 * (DTE + moneyness, both already on `MonitoredPosition` from the portfolio
 * snapshot + observation store). It does NOT require — and must not gate on —
 * an admissible option-chain quote, the indicative close debit, or any
 * consequence-layer fact. Consequence degradation (e.g. an inadmissible chain,
 * unavailable CLOSE debit) must NEVER erase a candidate detected here.
 *
 * Detection is NOT a recommendation: "candidate" means *operator review
 * warranted*, never CLOSE/HOLD recommended, EV winner, or automatic action
 * (Policy over Prediction; operator agency preserved).
 */

/**
 * Contract-state inputs for detection. All from `MonitoredPosition` (portfolio
 * snapshot + observation store) — no chain-quote/admissibility inputs.
 */
export interface BtcReviewContractState {
  side: "put" | "call";
  /** Days to expiration (temporal proximity). */
  dte: number;
  /**
   * Signed moneyness as a fraction of strike, positive = ITM, negative = OTM
   * (the `MonitoredPosition.moneyness` convention). Null when no admissible
   * underlying observation exists.
   */
  moneyness: number | null;
}

/**
 * Detection outcome for the row indicator:
 *   - "candidate"          — review warranted → RED attention indicator.
 *   - "lifecycle-ambiguous"— cannot confirm the obligation is current (§14a) →
 *                            NOT a confirmed candidate; subtle/uncertain, never red.
 *   - "not-candidate"      — posture does not currently warrant review → no indicator.
 */
export type BtcReviewDetection = "candidate" | "lifecycle-ambiguous" | "not-candidate";

/**
 * Provisional governed detection thresholds (ADR-013 flagged categorical
 * thresholds as deferred to a subsequent design artifact; these are that
 * artifact's provisional, observable, adjustable values — NOT a recommendation
 * policy). Declared here as one authoritative home so the criteria are
 * inspectable and tunable from operation.
 */
export interface BtcReviewThresholds {
  /**
   * Temporal proximity: at or under this many DTE, resolution is imminent enough
   * that a held short obligation warrants operator review of its lifecycle
   * (let-resolve vs buy-to-close vs — later — roll). This is the primary,
   * governing condition; the moneyness posture only classifies the KIND of
   * review, it does not decide whether review is warranted.
   */
  nearDteMax: number;
  /**
   * Near-strike magnitude (|moneyness|) at/under which the resolution direction
   * is genuinely live (ATM/near-strike). Used only to LABEL the review kind
   * (assignment-review vs let-expire review); it does not gate candidacy.
   */
  nearStrikeMagnitude: number;
}

/**
 * Provisional defaults. DTE ≤ 5 is "near-term"; |moneyness| ≤ 5% is near-strike.
 * Observable/adjustable, no symbol/strike/date specifics, no recommendation.
 */
export const DEFAULT_BTC_REVIEW_THRESHOLDS: BtcReviewThresholds = Object.freeze({
  nearDteMax: 5,
  nearStrikeMagnitude: 0.05,
});

/**
 * The kind of review a detected candidate warrants (LABEL only — never a
 * recommendation). Consumers may present this; it does not change the fact that
 * review is warranted.
 */
export type BtcReviewKind = "assignment-review" | "let-expire-or-close-review" | null;

/**
 * Detect whether a held single-leg short obligation is a BTC-review candidate
 * from contract state alone (Decision Pressure). Pure, deterministic, and
 * independent of chain admissibility / consequence availability.
 *
 * GOVERNING RULE: a held single-leg short obligation is a BTC-review candidate
 * when resolution is imminent — i.e. DTE ≤ nearDteMax AND its current moneyness
 * posture is established from an admissible underlying observation. At near DTE
 * the resolution is close either way, so both an OTM short (let-expire / cheap
 * buy-to-close review) and an ITM/near-strike short (assignment review) warrant
 * operator review. Moneyness only labels the KIND; it does not gate candidacy.
 *
 * @param contract - contract-state inputs (DTE + moneyness)
 * @param lifecycleAmbiguous - §14a: authoritative Activity conflicts with the
 *   projected open obligation, so we cannot confirm it is current. When true we
 *   do NOT assert a confirmed candidate.
 * @param thresholds - provisional governed thresholds (default above)
 */
export function classifyBtcReviewCandidate(
  contract: BtcReviewContractState,
  lifecycleAmbiguous: boolean,
  thresholds: BtcReviewThresholds = DEFAULT_BTC_REVIEW_THRESHOLDS
): BtcReviewDetection {
  // §14a: if we cannot confirm the obligation is current, we cannot confirm it
  // is a candidate. Not red; not a confident "not-candidate" either.
  if (lifecycleAmbiguous) return "lifecycle-ambiguous";

  // Temporal proximity is the governing condition. A far-dated obligation is not
  // currently a review candidate regardless of moneyness.
  if (!Number.isFinite(contract.dte) || contract.dte > thresholds.nearDteMax) {
    return "not-candidate";
  }

  // Moneyness is the spatial half of resolution proximity. Without an admissible
  // underlying observation we cannot establish the posture from contract state,
  // so we do not assert a candidate (detection is evidence-grounded, not assumed).
  const m = contract.moneyness;
  if (m == null || !Number.isFinite(m)) return "not-candidate";

  // Near DTE + an established moneyness posture ⇒ resolution imminent ⇒ review
  // warranted. (DBO Sep-18 $21 specimen: ~2 DTE, OTM ⇒ let-expire/cheap-BTC
  // review candidate.) The moneyness split only labels the review kind below.
  return "candidate";
}

/**
 * Label the KIND of review for a detected candidate (presentation only; never a
 * recommendation). Returns null when not a candidate or moneyness is unknown.
 */
export function btcReviewKind(
  contract: BtcReviewContractState,
  detection: BtcReviewDetection,
  thresholds: BtcReviewThresholds = DEFAULT_BTC_REVIEW_THRESHOLDS
): BtcReviewKind {
  if (detection !== "candidate") return null;
  const m = contract.moneyness;
  if (m == null || !Number.isFinite(m)) return null;
  // ITM or near-strike → assignment-review; clearly OTM → let-expire/close review.
  if (m > 0 || Math.abs(m) <= thresholds.nearStrikeMagnitude) return "assignment-review";
  return "let-expire-or-close-review";
}
