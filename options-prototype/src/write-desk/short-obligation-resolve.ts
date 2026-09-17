/**
 * Short-Obligation resolution + shared evaluation entrypoint.
 *
 * This is the ONE place that turns a selected `MonitoredPosition` + current
 * portfolio snapshot into an evaluated HOLD/CLOSE pair. Both consumers use it:
 *   - the Position Detail HOLD-vs-CLOSE section (full facts presentation), and
 *   - the Operator Console row-notice indicator (the BTS bell).
 *
 * Keeping resolution + evaluation + the governed decision here guarantees the
 * row indicator and the opened detail can never disagree: both consume the SAME
 * `ResolvedShortObligation` (candidate + decision + pair). The row indicator is
 * the decision's `attention`; the modal leads with the decision's headline and
 * renders the same pair. It duplicates no evaluation logic and weakens no
 * fail-closed behavior.
 *
 * Read-only: no mutation, no acquisition, no provider calls.
 */

import type { DurableMarketCache } from "../cache/durable-cache";
import { getDurableCache } from "../cache/durable-cache";
import type { MonitoredPosition } from "../portfolio/position-monitoring";
import type { PortfolioSnapshot } from "./types";
import type { MarketSessionClassification } from "../market-session/session-policy";
import type { ActivityRow } from "../csv/fidelity/activityParser";
import { getActivityRows } from "../portfolio/portfolio-store";
import { buildShortObligationEvidence } from "./short-obligation-evidence";
import {
  evaluateShortObligationConsequences,
  type ShortObligation,
  type ShortObligationEvidence,
  type ConsequenceResult,
} from "./short-obligation-consequences";
import {
  classifyBtcReviewCandidate,
  type BtcReviewDetection,
  type BtcReviewContractState,
} from "./btc-review-candidate";
import {
  decideShortObligationLifecycle,
  type LifecycleDecision,
} from "./short-obligation-decision";

/** The evaluated pair (both supplied alternatives) + the assembled evidence. */
export interface EvaluatedPair {
  hold: ConsequenceResult;
  close: ConsequenceResult;
  evidence: ShortObligationEvidence;
}

/**
 * A fully-resolved per-position result: the NOTICE candidate detection, the
 * governed DECIDE action, and the EVALUATE consequence pair. Console-owned,
 * computed once; consumed by both the row indicator (decision.attention) and the
 * opened detail (decision headline + pair facts). Single evaluation, one truth.
 */
export interface ResolvedShortObligation {
  candidate: BtcReviewDetection;
  decision: LifecycleDecision;
  pair: EvaluatedPair;
}

/**
 * Map a MonitoredPosition to the evaluator's obligation subject. Only single-leg
 * short puts and short calls (incl. buy-write covered calls) qualify.
 */
export function toObligation(position: MonitoredPosition): ShortObligation | null {
  if (position.type === "put") {
    return {
      symbol: position.underlying,
      side: "put",
      strike: position.strike,
      expiration: position.expiration,
      contracts: position.quantity,
      dte: position.dte,
    };
  }
  if (position.type === "call" || position.type === "buy-write") {
    return {
      symbol: position.underlying,
      side: "call",
      strike: position.strike,
      expiration: position.expiration,
      contracts: position.quantity,
      dte: position.dte,
      origin: position.type === "buy-write" ? "buy-write" : null,
    };
  }
  return null;
}

/**
 * Re-resolve the obligation subject from the CURRENT authoritative snapshot. The
 * passed MonitoredPosition establishes WHICH obligation is selected; its
 * quantity/identity are re-read from the snapshot so a changed quantity or a
 * superseded subject is reflected. Returns null when the selected obligation no
 * longer exists in the current snapshot.
 */
export function resolveCurrentObligation(
  position: MonitoredPosition,
  snapshot: PortfolioSnapshot
): ShortObligation | null {
  const base = toObligation(position);
  if (!base) return null;

  const current =
    base.side === "put"
      ? snapshot.existingPuts.find(
          (p) =>
            p.underlying.toUpperCase() === base.symbol.toUpperCase() &&
            p.strike === base.strike &&
            p.expiration === base.expiration
        )
      : snapshot.existingCalls.find(
          (c) =>
            c.underlying.toUpperCase() === base.symbol.toUpperCase() &&
            c.strike === base.strike &&
            c.expiration === base.expiration
        );
  if (!current) return null;
  return { ...base, contracts: current.quantity };
}

/**
 * Resolve the gross opening credit (X1) from broker-reported option basis, where
 * derivable. `brokerOptionBasis` is negative when a credit was received; we
 * present its magnitude. This is a POSITION-LEVEL / blended broker figure, NOT
 * lot/contract-attributed, so attribution is `blended` (never a `known` opening
 * credit). Null / projected / demo → unavailable.
 */
export function resolveOpeningCredit(
  obligation: ShortObligation,
  snapshot: PortfolioSnapshot
): { value: number | null; attribution: "authoritative" | "blended" | "unavailable" } {
  const match =
    obligation.side === "put"
      ? snapshot.existingPuts.find(
          (p) =>
            p.underlying.toUpperCase() === obligation.symbol.toUpperCase() &&
            p.strike === obligation.strike &&
            p.expiration === obligation.expiration
        )
      : snapshot.existingCalls.find(
          (c) =>
            c.underlying.toUpperCase() === obligation.symbol.toUpperCase() &&
            c.strike === obligation.strike &&
            c.expiration === obligation.expiration
        );
  const basis = match?.brokerOptionBasis ?? null;
  if (basis == null || !Number.isFinite(basis)) return { value: null, attribution: "unavailable" };
  return { value: Math.abs(basis), attribution: "blended" };
}

/**
 * Deterministic serialized identity of the guard-relevant Activity evidence,
 * used DIRECTLY as an invalidation key — NOT compressed through a lossy hash
 * (Codex correction #3). Two distinct guard-relevant evidence sets must always
 * produce distinct identities. Fields are exactly those §14a consumes; each row
 * is length-prefixed so concatenation cannot alias across rows.
 */
export function serializeActivityForGuard(rows: readonly ActivityRow[] | null): string {
  if (!rows || rows.length === 0) return "activity:none";
  const parts: string[] = [`n${rows.length}`];
  for (const r of rows) {
    const o = r.option;
    const opt = o ? `${o.type}|${o.underlying}|${o.strike}|${o.expiration}` : "";
    const rowId = `${r.eventType}@${r.date}~${r.symbol ?? ""}~${opt}`;
    parts.push(`${rowId.length}:${rowId}`);
  }
  return `activity:${parts.join("\u0001")}`;
}

/** Current Activity evidence identity for invalidation (reads the live store). */
export function activityIdentity(): string {
  return serializeActivityForGuard(getActivityRows());
}

/**
 * The single shared evaluation entrypoint. Reads cached evidence + authoritative
 * Activity via the adapter, then evaluates BOTH supplied alternatives (§22 —
 * one alternative at a time). Deterministic and read-only. Both the detail
 * section and the row-notice hook call this so their results cannot diverge.
 */
export async function loadHoldClosePair(
  obligation: ShortObligation,
  snapshot: PortfolioSnapshot,
  sessionClassification: MarketSessionClassification,
  cache: DurableMarketCache = getDurableCache()
): Promise<EvaluatedPair> {
  const activityRows = getActivityRows();
  const checkpointQuoteDate = snapshot.provenance?.optionSummaryExportTimestamp ?? null;
  const openingCredit = resolveOpeningCredit(obligation, snapshot);

  const evidence = await buildShortObligationEvidence(obligation, cache, sessionClassification, {
    activityRows,
    checkpointQuoteDate,
    openingCredit: openingCredit.value,
    openingCreditAttribution: openingCredit.attribution,
    assignmentIntent: "unknown",
  });

  const hold = evaluateShortObligationConsequences(obligation, "hold", evidence);
  const close = evaluateShortObligationConsequences(obligation, "close", evidence);
  return { hold, close, evidence };
}

/**
 * Fully resolve one position through NOTICE → EVALUATE → DECIDE in one pass.
 *
 * - NOTICE: `classifyBtcReviewCandidate` from CONTRACT STATE (position DTE +
 *   moneyness) + §14a lifecycle ambiguity (from the evaluated evidence). Never
 *   uses chain admissibility.
 * - EVALUATE: the shared `loadHoldClosePair` (per-fact consequence facts).
 * - DECIDE: `decideShortObligationLifecycle` — the governed action, resting on
 *   supported subject/underlying evidence; close-price support only affects the
 *   execution caveat / policy-required deferral, never erases the action.
 *
 * Returns null when the position is not an existing single-leg short obligation
 * or is no longer present in the snapshot.
 */
export async function resolveShortObligation(
  position: MonitoredPosition,
  snapshot: PortfolioSnapshot,
  sessionClassification: MarketSessionClassification,
  cache: DurableMarketCache = getDurableCache(),
  loadPair?: (o: ShortObligation, s: PortfolioSnapshot, sc: MarketSessionClassification) => Promise<EvaluatedPair>,
): Promise<ResolvedShortObligation | null> {
  const obligation = resolveCurrentObligation(position, snapshot);
  if (!obligation) return null;

  const pair = loadPair
    ? await loadPair(obligation, snapshot, sessionClassification)
    : await loadHoldClosePair(obligation, snapshot, sessionClassification, cache);

  // §14a lifecycle ambiguity is a subject-level condition surfaced by the
  // evaluator's refusal. Detection consumes it (not chain admissibility).
  const lifecycleAmbiguous =
    pair.hold.kind === "refused" && pair.hold.reason === "lifecycle-state-ambiguous";

  // NOTICE — contract-state candidate detection.
  const contractState: BtcReviewContractState = {
    side: obligation.side,
    dte: position.dte,
    moneyness: position.moneyness,
  };
  const candidate: BtcReviewDetection = classifyBtcReviewCandidate(contractState, lifecycleAmbiguous);

  // Whether current close price is SUPPORTED (admissible + usable). The evaluator
  // marks the CLOSE debit `unavailable` when unsupported; use that as the signal.
  const closePriceSupported = closeDebitSupported(pair);

  // DECIDE — governed action.
  const decision: LifecycleDecision = decideShortObligationLifecycle({
    side: obligation.side,
    dte: position.dte,
    moneyness: position.moneyness,
    candidate,
    closePriceSupported,
  });

  return { candidate, decision, pair };
}

/** Whether the evaluated CLOSE debit is a supported (non-`unavailable`) value. */
function closeDebitSupported(pair: EvaluatedPair): boolean {
  const close = pair.close;
  if (close.kind !== "facts" || !close.close) return false;
  const debit = close.close.estimatedCloseDebit;
  return debit.value != null && debit.precision !== "unavailable";
}
