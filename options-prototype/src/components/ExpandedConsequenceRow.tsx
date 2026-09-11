/**
 * Expanded Consequence Row — Sell / Hold / Covered Call comparison surface
 * (PL-DEPLOY direction A; LVT-BET-LIFECYCLE-CHOICES × LVT-BET-CONSEQUENCE-ENVELOPE,
 *  realizing LVT-INIT-CONSEQUENCE-RELEASE-COST v1).
 *
 * WHY THIS EXISTS
 * ---------------
 * Working software falsified the narrow (~370px) covered-call inspection drawer
 * as the presentation for this comparison: the operator was forced to read
 * Sell / Hold / Covered Call serially, hold values in working memory, and
 * mentally reconstruct a comparison that should be visually available. The
 * information is intrinsically two-dimensional — ALTERNATIVES × CONSEQUENCE
 * DIMENSIONS — and needs horizontal, simultaneously-visible territory.
 *
 * This surface provides that territory adjacent to the candidate row that
 * invoked the question: the consequence DIMENSIONS run down the left as rows,
 * and the ALTERNATIVES (Sell / Hold / Covered Call) run across as columns, so
 * the operator scans one dimension across three alternatives at a glance.
 *
 * The expanded row is a BOUNDED, REVERSIBLE implementation mechanism for the
 * ratified horizontal-comparison direction — not permanent architecture. If
 * working software shows the mechanism is wrong, it can be replaced without
 * backing out the ratified comparison direction.
 *
 * BOUNDARY (governing)
 * --------------------
 * Presentation ONLY over the authoritative evaluator (release-cost-consequences.ts).
 * ZERO new economics, ZERO F1–F8 semantic change, no discovery, ranking,
 * selection, or recommendation — the candidate is already chosen upstream. The
 * adapter must not invent provenance, derive economic semantics, or fill missing
 * economic state. Deep candidate evidence (execution, strike neighborhood,
 * detailed provenance, explanatory prose) stays in the inspection drawer.
 */

import {
  evaluateReleaseConsequences,
  suppliedAlternativesForCoveredCall,
  SELL_VALUE_DISCLAIMER,
  OPENING_PREMIUM_DISCLAIMER,
  type ReleaseConsequenceFacts,
} from "../write-desk/release-cost-consequences";
import { formatAcquisitionAge, type EvidenceProvenance } from "../write-desk/evidence-provenance";
import type { CallCandidate } from "../write-desk/candidate-types";

function fmtMoney(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(0)}`;
}

/**
 * Truthful room-to-strike wording. Positive room (strike above spot, OTM) reads
 * as headroom to the strike; zero-or-negative room (spot at/above strike) reads
 * semantically instead of composing a malformed "+$-X.XX".
 */
function formatRoomToStrike(roomPerShare: number | null): string {
  if (roomPerShare == null) return "capped at strike";
  if (roomPerShare > 0) return `to strike (+$${roomPerShare.toFixed(2)}/sh headroom)`;
  if (roomPerShare === 0) return "at strike (no headroom)";
  return `above strike ($${Math.abs(roomPerShare).toFixed(2)}/sh in the money)`;
}

/**
 * Chain-acquisition age suffix for OPTION-derived facts (F3). Labeled truthfully
 * as chain acquisition age — the only provenance Wheelwright authoritatively has
 * for the option leg — never as a generic observation time.
 */
function chainAgeSuffix(provenance: EvidenceProvenance): string {
  const age = formatAcquisitionAge(provenance, Date.now());
  return age === "—" ? " · chain freshness unknown" : ` · chain acquired ${age} ago`;
}

/**
 * Spot-freshness marker for SPOT-derived facts (F1 / block value). Wheelwright
 * does NOT have authoritative quote/spot acquisition provenance (ADR-015 known
 * gap: spot is folded into the chain record from a separately-cached quote whose
 * independent acquisition time is discarded). The frontend must not launder
 * chain provenance into a spot-age claim, so this is always the honest unknown
 * until authoritative quote provenance exists.
 */
const SPOT_FRESHNESS = " · quote freshness unknown";

const ALT_LABEL: Record<string, string> = {
  sell: "Sell",
  hold: "Hold",
  "covered-call": "Covered Call",
};

/** One consequence dimension: a label + a per-alternative cell renderer. */
interface Dimension {
  key: string;
  label: string;
  title: string;
  /** Decision-essential dimensions get scan emphasis. */
  emphasis?: boolean;
  cell: (f: ReleaseConsequenceFacts) => string;
}

function downsideCell(f: ReleaseConsequenceFacts): string {
  switch (f.downsideEnvelope.kind) {
    case "no-continuing-share-downside":
      return "no continuing share downside (sold)";
    case "protective-floor":
      return "protective floor";
    case "no-protective-floor":
    default:
      return "no protective floor";
  }
}

/** Compact, scan-friendly resulting-holding label (avoids long prose dominating the grid). */
function resultingHoldingCell(f: ReleaseConsequenceFacts): string {
  switch (f.alternativeKind) {
    case "sell":
      return "→ cash";
    case "hold":
      return "shares retained";
    case "covered-call":
      return "shares, or → cash if assigned";
    default:
      return "—";
  }
}

/**
 * The §8 comparison fact set — the minimum authoritative dimensions that earn
 * scarce simultaneous-comparison territory. Everything else stays inspection-tier
 * in the drawer.
 */
const DIMENSIONS: Dimension[] = [
  {
    // F1 realizes a sale value ONLY for Sell (module-authoritative); Hold/CC → "—".
    key: "sale",
    label: "Realized if sold",
    title: SELL_VALUE_DISCLAIMER,
    emphasis: true,
    cell: (f) =>
      f.estimatedGrossSaleValue.value == null
        ? "—"
        : `${fmtMoney(f.estimatedGrossSaleValue.value)}${SPOT_FRESHNESS}`,
  },
  {
    key: "premium",
    label: "Opening premium",
    title: OPENING_PREMIUM_DISCLAIMER,
    emphasis: true,
    cell: (f) =>
      f.estimatedGrossOpeningPremium.value == null
        ? "—"
        : `${fmtMoney(f.estimatedGrossOpeningPremium.value)}${chainAgeSuffix(f.estimatedGrossOpeningPremium.provenance)}`,
  },
  {
    key: "exposure",
    label: "Exposure / next boundary",
    title: "Time to the represented contractual boundary. Not capital lockup — BTC/roll/unwind/sell-subject-to-close can change it.",
    emphasis: true,
    cell: (f) =>
      f.timeToContractualBoundaryDays == null
        ? f.nextDecisionBoundary.kind === "now"
          ? "immediate"
          : "open-ended"
        : `${f.timeToContractualBoundaryDays}d to boundary`,
  },
  {
    key: "upside",
    label: "Retained upside",
    title: "Structural upside/recovery retained for the evaluated block (not a prediction).",
    emphasis: true,
    cell: (f) =>
      f.retainedParticipation.kind === "none"
        ? "none"
        : f.retainedParticipation.kind === "full"
          ? "full"
          : formatRoomToStrike(f.retainedParticipation.roomToStrikePerShare),
  },
  {
    key: "downside",
    label: "Downside",
    title: "Continuing owned-share downside / protective floor for the evaluated block.",
    cell: downsideCell,
  },
  {
    key: "basis",
    label: "Basis-relative release effect",
    title: "Realized only by selling/releasing. Never 'exact' in v1 (evidence cannot prove single-lot).",
    cell: (f) =>
      f.basisRelativeReleaseEffect.precision === "not-applicable"
        ? "n/a (no release)"
        : f.basisRelativeReleaseEffect.value == null
          ? "unavailable"
          : `${fmtMoney(f.basisRelativeReleaseEffect.value)} (approx)`,
  },
  {
    key: "result",
    label: "Resulting holding",
    title: "What the operator holds after resolution for the evaluated block.",
    emphasis: true,
    cell: resultingHoldingCell,
  },
];

export function ExpandedConsequenceRow({ candidate }: { candidate: CallCandidate }) {
  // subjectShares = the CC's covered block = maxContracts × 100. Same block for all three.
  if (candidate.maxContracts <= 0) return null;

  const alternatives = suppliedAlternativesForCoveredCall({
    maxContracts: candidate.maxContracts,
    strike: candidate.strike,
    expiration: candidate.expiration,
    dte: candidate.dte,
    midPerShare: candidate.mid,
    provenance: candidate.evidenceProvenance ?? { kind: "unavailable" },
  });

  const ctx = {
    symbol: candidate.symbol,
    observedSpot: Number.isFinite(candidate.underlyingPrice) ? candidate.underlyingPrice : null,
    // Spot provenance is NOT chain provenance (ADR-015 known gap): honest unknown.
    spotProvenance: { kind: "unavailable" as const },
    averageBasisPerShare: candidate.basisPerShare,
    totalFreeShares: candidate.freeShares,
    // Authoritative separately-encumbered count carried from InventoryPosition —
    // never hardcoded/defaulted by the frontend.
    encumberedShares: candidate.encumberedShares,
  };

  const evaluated = alternatives.map((a) => evaluateReleaseConsequences(ctx, a));
  // Subject block size and shared block value both come from the authoritative
  // facts — presentation performs no independent economic arithmetic.
  const subjectShares = evaluated[0]?.subjectShares ?? candidate.maxContracts * 100;
  const residual = evaluated[0]?.resultingHolding.residualOutsideBlock ?? [];
  // Shared capital-block context — authoritative, identical for every alternative.
  // Displayed once as the starting value the alternatives act on; NOT a
  // per-alternative sale value. Quote-level freshness is unknown (ADR-015).
  const blockValue = evaluated[0]?.blockMarketValue.value ?? null;

  return (
    <div className="wd-expc" aria-label="Release and retention consequences">
      <div className="wd-expc-header">
        <div className="wd-expc-title-row">
          <span className="wd-expc-title">
            {candidate.symbol} · {subjectShares} shares under consideration
          </span>
          {blockValue != null && (
            <span
              className="wd-expc-blockvalue"
              title="Current approximate market value of the evaluated block (shares × spot). Shared context, not a per-alternative sale value. Quote freshness unknown."
            >
              block value ≈ {fmtMoney(blockValue)}
            </span>
          )}
        </div>
        <span className="wd-expc-sub">
          consequence facts across governed alternatives · not recommendations, ranking, or fills · quote freshness unknown
        </span>
      </div>

      {residual.length > 0 && (
        <div className="wd-expc-residual">Outside this block: {residual.join("; ")}.</div>
      )}

      <table className="wd-expc-grid">
        <thead>
          <tr>
            <th className="wd-expc-dim-head"> </th>
            {evaluated.map((f) => (
              <th key={f.alternativeKind} className="wd-expc-alt-head">
                {ALT_LABEL[f.alternativeKind]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIMENSIONS.map((dim) => (
            <tr key={dim.key} className={dim.emphasis ? "wd-expc-emph" : undefined}>
              <td className="wd-expc-dim" title={dim.title}>
                {dim.label}
              </td>
              {evaluated.map((f) => (
                <td key={f.alternativeKind} className="wd-expc-cell" title={dim.title}>
                  {dim.cell(f)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="wd-expc-footnote">
        Deep candidate evidence (execution, strike neighborhood, provenance) remains in the inspection drawer.
      </div>
    </div>
  );
}
