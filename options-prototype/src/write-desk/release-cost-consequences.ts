/**
 * Release / Retention Consequences — LVT-INIT-CONSEQUENCE-RELEASE-COST v1
 *
 * Pure function. No provider calls. Deterministic from a SUPPLIED governed
 * alternative + cached-evidence-derived candidate fields. Reads nothing it is
 * not given.
 *
 * OWNERSHIP BOUNDARY (governing — see docs/design/lvt-init-consequence-release-cost-v1-design.md §1):
 *   This module CONSUMES an already-known governed alternative and EMITS its
 *   independent consequence facts. It does NOT discover, enumerate, rank,
 *   select, or recommend alternatives. Alternative discovery (which strike,
 *   which DTE, which contract quantity, whether a collar is possible) belongs
 *   to LVT-BET-LIFECYCLE-CHOICES / the existing candidate-generation logic.
 *   The supplied alternative arrives fully specified, including subjectShares.
 *
 * v1 first slice: Sell, Hold, existing Covered Call. Collar deferred.
 *
 * The unit of comparison is a SUBJECT SHARE BLOCK. Every alternative evaluated
 * for one comparison row describes the SAME subjectShares block. Residual free
 * shares and separately-encumbered shares are OUTSIDE the block and reported
 * separately — never folded into a compared alternative. This is the 4AM
 * quantity finding: a 2-contract CC on a 250-free-share position acts on 200
 * shares; Sell/Hold on that row must also describe 200, not 250.
 *
 * Non-goals (v1): no scalar/score, no ranking, no capital-state machine, no
 * transition graph, no path optimizer, no recovery/price prediction, no
 * cross-symbol affordability, no lifecycle-accounting of net retained
 * compensation, no new provider calls. Complexity stays evidence-earned.
 */

import type { EvidenceProvenance } from "./evidence-provenance";
import { PROVENANCE_UNAVAILABLE } from "./evidence-provenance";

// --- Alternative kinds (v1 first slice) ---

export type ReleaseAlternativeKind = "sell" | "hold" | "covered-call";

/**
 * A supplied, fully-specified governed alternative to evaluate. This is the
 * INPUT contract; this module does not construct these beyond the two trivial
 * derived alternatives (Sell, Hold) that share the CC's subject block. The CC
 * alternative is supplied by existing candidate generation.
 */
export interface SuppliedAlternative {
  kind: ReleaseAlternativeKind;
  /** The capital block this alternative acts on. Shares, always a multiple of 100 for option structures. */
  subjectShares: number;
  /** Covered-call leg (present only for kind === "covered-call"). */
  callLeg?: {
    strike: number;
    expiration: string;
    dte: number;
    /** Midpoint premium per share (indicative; (bid+ask)/2). */
    midPerShare: number;
    contracts: number;
    /** Chain-acquisition provenance for the option evidence backing this leg. */
    provenance: EvidenceProvenance;
  };
}

/** Position context the consequence model reads (all supplied; nothing discovered). */
export interface ReleaseContext {
  symbol: string;
  /** Observed underlying spot used for F1/F5. */
  observedSpot: number | null;
  /** Provenance for the spot-derived facts (F1). */
  spotProvenance: EvidenceProvenance;
  /**
   * Broker-reported symbol-level AVERAGE basis per share. Blended/accounting
   * basis, NOT capital-cycle basis, and NOT lot-attributed. May be null.
   */
  averageBasisPerShare: number | null;
  /** Total free shares in the position (for residual reporting). */
  totalFreeShares: number;
  /** Separately-encumbered shares in the position (for residual reporting). */
  encumberedShares: number;
}

// --- Precision metadata ---

/**
 * F8 precision. v1 emits ONLY `blended-approximate` or `unavailable`. `exact`
 * is RESERVED for a future authoritative-lot-attribution state
 * (LVT-INIT-OUTCOME-BASIS) and is NEVER produced from current evidence, because
 * current evidence cannot prove a symbol-level average came from a single lot.
 */
export type BasisPrecision = "blended-approximate" | "unavailable" | "not-applicable" | "exact";

// --- Consequence facts (F1–F8) ---

export interface ReleaseConsequenceFacts {
  alternativeKind: ReleaseAlternativeKind;
  /** The capital block these facts describe. */
  subjectShares: number;

  /**
   * Current approximate market value of the evaluated share block
   * (subjectShares × observed spot). SHARED capital-block context — the same
   * for every alternative on the row. This is NOT a realized consequence of any
   * alternative; it is the common starting value the alternatives act on, shown
   * once as row context (never as a per-alternative sale value).
   */
  blockMarketValue: {
    value: number | null;
    provenance: EvidenceProvenance;
  };

  /**
   * F1 — Estimated gross sale value. Present (non-null) ONLY for Sell, because
   * only selling realizes a sale value. Hold and Covered Call do not produce a
   * sale value, so their `value` is null. subjectShares × observed spot,
   * pre-trade estimate. See `blockMarketValue` for the shared block context that
   * every alternative starts from.
   */
  estimatedGrossSaleValue: {
    value: number | null;
    provenance: EvidenceProvenance;
    /** Fixed disclaimer classifying what this is NOT. */
    disclaimer: "estimated-gross-not-proceeds-not-buying-power";
  };

  /**
   * F2 — Time to represented contractual boundary (exposure duration), in days.
   * null for Sell (immediate) and bare Hold (open-ended). NOT capital lockup:
   * BTC/roll/unwind/sell-subject-to-close can change the boundary.
   */
  timeToContractualBoundaryDays: number | null;

  /**
   * F3 — Estimated gross opening premium. Gross opening credit only; excludes
   * fees and any later BTC/roll/unwind economics. NOT retained net compensation.
   * null when no option leg (Sell/Hold).
   */
  estimatedGrossOpeningPremium: {
    value: number | null;
    provenance: EvidenceProvenance;
    disclaimer: "gross-opening-only-not-retained-net";
  };

  /**
   * F4 — Downside envelope. Three distinct authoritative states so presentation
   * cannot collapse Sell into "no protective floor":
   *   - "no-continuing-share-downside": the block is sold; the shares no longer
   *     carry continuing owned-equity downside (Sell).
   *   - "no-protective-floor": still holding equity with no protective floor
   *     above zero (bare Hold; Covered Call — premium cushions but is not a floor).
   *   - "protective-floor": a structural floor above zero exists (reserved; e.g.
   *     a future collar).
   * Never expressed as "unbounded/unlimited" for owned equity.
   */
  downsideEnvelope: {
    kind: "no-continuing-share-downside" | "no-protective-floor" | "protective-floor";
    /** True only for the protective-floor kind. Retained for convenience. */
    hasProtectiveFloorAboveZero: boolean;
    note: string;
  };

  /**
   * F5 — Retained participation / recovery room (structural, not predictive),
   * scoped to subjectShares. For CC: upside room to strike (per share). For
   * Hold: full (unbounded above, room = null sentinel with note). For Sell: none.
   */
  retainedParticipation: {
    kind: "none" | "capped-to-strike" | "full";
    roomToStrikePerShare: number | null;
    note: string;
  };

  /**
   * F6 — Resulting holding / resolution outcome of the evaluated block.
   * Expiration branches are explicitly scoped "if held through expiration".
   * Residual holdings are named separately, outside the block outcome.
   */
  resultingHolding: {
    /** Scoped-if-held-through-expiration branches (empty for Sell). */
    ifHeldThroughExpiration: string[];
    /** Acknowledged, structurally-possible earlier exits (simple descriptions, no state machine). */
    earlierExits: string[];
    /** Immediate outcome for non-option alternatives (Sell/Hold). */
    immediate: string | null;
    /** Residual holdings outside the evaluated block. */
    residualOutsideBlock: string[];
  };

  /** F7 — Next decision boundary (evidence-grounded, non-predictive). */
  nextDecisionBoundary: {
    kind: "now" | "expiration" | "open";
    expiration: string | null;
  };

  /**
   * F8 — Basis-relative release effect on the subject block, with precision.
   * v1 NEVER emits `exact`.
   */
  basisRelativeReleaseEffect: {
    value: number | null;
    precision: BasisPrecision;
    note: string;
  };
}

/**
 * Human-readable disclaimer text for the F1 (sale value) and F3 (opening premium)
 * facts. The facts themselves carry a stable enum `disclaimer` tag; these strings
 * are the canonical expansion presentation layers may surface. Exported so the
 * disclaimer wording has one authoritative source rather than being re-typed in UI.
 */
export const SELL_VALUE_DISCLAIMER =
  "Estimates the gross value represented by selling the evaluated share block; " +
  "not an execution price, actual proceeds, or a guarantee of immediately deployable buying power.";

export const OPENING_PREMIUM_DISCLAIMER =
  "Estimated gross opening credit at current midpoint; excludes fees and any later " +
  "buy-to-close, roll, or unwind economics. Not a claim about ultimately retained net compensation.";

/**
 * Evaluate the consequence facts for one supplied alternative on its subject block.
 *
 * Pure and deterministic. Does not read a chain, does not select a strike, does
 * not choose the quantity — all of that is in the supplied alternative.
 */
export function evaluateReleaseConsequences(
  ctx: ReleaseContext,
  alt: SuppliedAlternative
): ReleaseConsequenceFacts {
  const { subjectShares } = alt;

  // F1 — estimated gross sale value (block × spot). Same block for every alternative on the row.
  const estGross =
    ctx.observedSpot != null && Number.isFinite(ctx.observedSpot)
      ? subjectShares * ctx.observedSpot
      : null;

  // Residual holdings outside the evaluated block (same for every alternative on the row).
  const residual: string[] = [];
  const residualFree = Math.max(0, ctx.totalFreeShares - subjectShares);
  if (residualFree > 0) {
    residual.push(`${residualFree} free shares unaffected (outside the evaluated block)`);
  }
  if (ctx.encumberedShares > 0) {
    residual.push(`${ctx.encumberedShares} separately-encumbered shares unaffected`);
  }

  // F8 — basis-relative RELEASE effect. This is realized only by SELLING/releasing
  // the evaluated block. Holding shares or opening a covered call does NOT realize
  // it, so F8 is `not-applicable` for those alternatives (economic semantics, not a
  // presentation choice). Never `exact` in v1.
  const f8 =
    alt.kind === "sell"
      ? computeBasisRelativeReleaseEffect(ctx, subjectShares)
      : notApplicableReleaseEffect(alt.kind);

  // Shared block market value: the same authoritative subjectShares × spot for
  // every alternative on the row. Sell realizes it as a sale value (F1 below);
  // Hold/CC do not, so their estimatedGrossSaleValue is null.
  const blockProvenance = estGross != null ? ctx.spotProvenance : PROVENANCE_UNAVAILABLE;

  // A sale value is realized ONLY by Sell. Hold/CC produce no sale value.
  const saleValueForAlt = alt.kind === "sell" ? estGross : null;

  const base = {
    alternativeKind: alt.kind,
    subjectShares,
    blockMarketValue: {
      value: estGross,
      provenance: blockProvenance,
    },
    estimatedGrossSaleValue: {
      value: saleValueForAlt,
      provenance: saleValueForAlt != null ? ctx.spotProvenance : PROVENANCE_UNAVAILABLE,
      disclaimer: "estimated-gross-not-proceeds-not-buying-power" as const,
    },
    basisRelativeReleaseEffect: f8,
  };

  if (alt.kind === "sell") {
    return {
      ...base,
      timeToContractualBoundaryDays: null,
      estimatedGrossOpeningPremium: {
        value: null,
        provenance: PROVENANCE_UNAVAILABLE,
        disclaimer: "gross-opening-only-not-retained-net",
      },
      downsideEnvelope: {
        kind: "no-continuing-share-downside",
        hasProtectiveFloorAboveZero: false,
        note: "Shares sold: the block is converted to cash; no continuing owned-share downside on the evaluated shares.",
      },
      retainedParticipation: {
        kind: "none",
        roomToStrikePerShare: null,
        note: "Selling retains no further participation in the evaluated block.",
      },
      resultingHolding: {
        ifHeldThroughExpiration: [],
        earlierExits: [],
        immediate: `${subjectShares} shares → cash (estimated gross value above; actual proceeds unknown until fill).`,
        residualOutsideBlock: residual,
      },
      nextDecisionBoundary: { kind: "now", expiration: null },
    };
  }

  if (alt.kind === "hold") {
    return {
      ...base,
      timeToContractualBoundaryDays: null,
      estimatedGrossOpeningPremium: {
        value: null,
        provenance: PROVENANCE_UNAVAILABLE,
        disclaimer: "gross-opening-only-not-retained-net",
      },
      downsideEnvelope: {
        kind: "no-protective-floor",
        hasProtectiveFloorAboveZero: false,
        note: "Holding bare shares: no protective floor above zero (loss is bounded only by shares → 0, which is not protection).",
      },
      retainedParticipation: {
        kind: "full",
        roomToStrikePerShare: null,
        note: "Holding retains full participation in the evaluated block.",
      },
      resultingHolding: {
        ifHeldThroughExpiration: [],
        earlierExits: [],
        immediate: `${subjectShares} shares retained; no contractual boundary (open-ended).`,
        residualOutsideBlock: residual,
      },
      nextDecisionBoundary: { kind: "open", expiration: null },
    };
  }

  // covered-call
  const leg = alt.callLeg;
  if (!leg) {
    // Defensive: a covered-call alternative must arrive with its leg. Do not invent one.
    throw new Error("covered-call alternative supplied without callLeg");
  }
  const grossOpeningPremium = leg.midPerShare * 100 * leg.contracts;
  const roomToStrike =
    ctx.observedSpot != null && Number.isFinite(ctx.observedSpot)
      ? leg.strike - ctx.observedSpot
      : null;

  return {
    ...base,
    timeToContractualBoundaryDays: leg.dte,
    estimatedGrossOpeningPremium: {
      value: grossOpeningPremium,
      provenance: leg.provenance,
      disclaimer: "gross-opening-only-not-retained-net",
    },
    downsideEnvelope: {
      kind: "no-protective-floor",
      hasProtectiveFloorAboveZero: false,
      note: "Covered call: premium cushions but provides no protective floor above zero on the shares.",
    },
    retainedParticipation: {
      kind: "capped-to-strike",
      roomToStrikePerShare: roomToStrike,
      note:
        "Upside participation capped at the call strike. Gross opening credit is received; " +
        "net retained compensation depends on later buy-to-close / roll / unwind economics.",
    },
    resultingHolding: {
      ifHeldThroughExpiration: [
        `If held through expiration and OTM: ${subjectShares} shares remain held.`,
        `If held through expiration and assigned: ${subjectShares} shares called away → cash at strike.`,
      ],
      earlierExits: [
        "Buy-to-close the call: shares remain held.",
        "Roll the call: shares remain held with a replacement short-call obligation.",
        "Close the call then sell the shares: resulting cash consequence per evidence available at that time.",
      ],
      immediate: null,
      residualOutsideBlock: residual,
    },
    nextDecisionBoundary: { kind: "expiration", expiration: leg.expiration },
  };
}

/**
 * F8 — basis-relative release effect. v1 rule: current symbol-level average
 * basis can only yield `blended-approximate`; absence yields `unavailable`.
 * `exact` is NEVER returned here — it is reserved for future authoritative lot
 * attribution and cannot be justified from current evidence (no lot count/identity).
 */
/**
 * F8 for non-release alternatives (Hold, Covered Call). The basis-relative
 * RELEASE effect is not realized by holding or by opening a covered call, so it
 * is `not-applicable` — never a computed sale figure, and never a substitute
 * unrealized-P&L fact (that would broaden the Initiative).
 */
function notApplicableReleaseEffect(
  kind: Exclude<ReleaseAlternativeKind, "sell">
): ReleaseConsequenceFacts["basisRelativeReleaseEffect"] {
  return {
    value: null,
    precision: "not-applicable",
    note:
      kind === "hold"
        ? "Not applicable: holding does not realize a basis-relative release effect."
        : "Not applicable: opening a covered call does not realize a basis-relative release effect.",
  };
}

function computeBasisRelativeReleaseEffect(
  ctx: ReleaseContext,
  subjectShares: number
): ReleaseConsequenceFacts["basisRelativeReleaseEffect"] {
  if (
    ctx.averageBasisPerShare == null ||
    !Number.isFinite(ctx.averageBasisPerShare) ||
    ctx.observedSpot == null ||
    !Number.isFinite(ctx.observedSpot)
  ) {
    return {
      value: null,
      precision: "unavailable",
      note: "No authoritative basis (or spot) available; exact release effect requires lot-level attribution.",
    };
  }
  const value = subjectShares * (ctx.observedSpot - ctx.averageBasisPerShare);
  return {
    value,
    precision: "blended-approximate",
    note:
      "Approximate: derived from symbol-level average basis. Evidence cannot prove single-lot, " +
      "so this is not exact. Exact release effect requires authoritative lot attribution.",
  };
}

/**
 * Build the v1 first-slice supplied alternatives (Sell, Hold, existing CC) that
 * all share ONE subject block, from an already-selected covered-call candidate.
 *
 * subjectShares = the CC's covered shares = maxContracts × 100 — the same block
 * for all three, so the comparison is like-for-like (4AM quantity finding).
 *
 * This helper composes the trivial Sell/Hold alternatives around a SUPPLIED CC
 * candidate. It does not choose the CC's strike/DTE/quantity — those are already
 * decided upstream. It is a convenience for the surface, not an alternative
 * discovery engine.
 */
export function suppliedAlternativesForCoveredCall(cc: {
  maxContracts: number;
  strike: number;
  expiration: string;
  dte: number;
  midPerShare: number;
  provenance: EvidenceProvenance;
}): SuppliedAlternative[] {
  const subjectShares = cc.maxContracts * 100;
  return [
    { kind: "sell", subjectShares },
    { kind: "hold", subjectShares },
    {
      kind: "covered-call",
      subjectShares,
      callLeg: {
        strike: cc.strike,
        expiration: cc.expiration,
        dte: cc.dte,
        midPerShare: cc.midPerShare,
        contracts: cc.maxContracts,
        provenance: cc.provenance,
      },
    },
  ];
}
