/**
 * Release / Retention Consequences section (LVT-INIT-CONSEQUENCE-RELEASE-COST v1).
 *
 * Presentational adjacency ONLY. Composes the v1 first-slice alternatives
 * (Sell / Hold / existing CC) around the SUPPLIED covered-call candidate and
 * renders each alternative's consequence facts on one shared subjectShares
 * block. It does not discover, rank, select, or recommend — the candidate is
 * already chosen upstream. See docs/design/lvt-init-consequence-release-cost-v1-design.md.
 *
 * Extracted to its own file so the FE/BE economic-truth boundary (where the v1
 * conformance defects lived) is independently testable. The adapter must not
 * invent provenance, derive economic semantics, or fill missing economic state.
 */

import {
  evaluateReleaseConsequences,
  suppliedAlternativesForCoveredCall,
  SELL_VALUE_DISCLAIMER,
  OPENING_PREMIUM_DISCLAIMER,
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
 * as headroom to the strike; zero-or-negative room (spot at/above strike, ATM/ITM)
 * reads semantically instead of composing a malformed "+$-X.XX".
 */
function formatRoomToStrike(roomPerShare: number): string {
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
  return age === "—" ? " (chain freshness unknown)" : ` (chain acquired ${age} ago)`;
}

/**
 * Spot-freshness suffix for SPOT-derived facts (F1). Wheelwright does NOT have
 * authoritative quote/spot acquisition provenance (ADR-015 known gap: spot is
 * folded into the chain record from a separately-cached quote whose independent
 * acquisition time is discarded). The frontend must not launder chain provenance
 * into a spot-age claim, so this is always the honest unknown until authoritative
 * quote provenance exists.
 */
function spotFreshnessSuffix(): string {
  return " (quote freshness unknown)";
}

export function ReleaseConsequencesSection({ candidate }: { candidate: CallCandidate }) {
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
    // Spot provenance is NOT chain provenance. Wheelwright has no authoritative
    // quote-acquisition time (ADR-015 known gap); do not launder the chain's
    // provenance into a spot-age claim. Honest unknown until quote provenance exists.
    spotProvenance: { kind: "unavailable" as const },
    averageBasisPerShare: candidate.basisPerShare,
    totalFreeShares: candidate.freeShares,
    // Authoritative separately-encumbered count carried from InventoryPosition —
    // never hardcoded/defaulted by the frontend.
    encumberedShares: candidate.encumberedShares,
  };

  const evaluated = alternatives.map((a) => evaluateReleaseConsequences(ctx, a));
  const subjectShares = candidate.maxContracts * 100;
  const residual = evaluated[0]?.resultingHolding.residualOutsideBlock ?? [];

  const label: Record<string, string> = {
    sell: "Sell",
    hold: "Hold",
    "covered-call": "Covered Call",
  };

  return (
    <section className="rb-section" aria-label="Release and retention consequences">
      <h4 className="rb-section-title">
        Release / Retention Consequences
        <span className="rb-section-note"> · evaluated block: {subjectShares} shares</span>
      </h4>
      <div className="rb-consequence-note">
        Pre-trade consequence facts for the same {subjectShares}-share block across supplied
        alternatives. Not recommendations, ranking, or fills.
      </div>
      {residual.length > 0 && (
        <div className="rb-consequence-residual">
          Outside this block: {residual.join("; ")}.
        </div>
      )}

      <div className="rb-consequence-grid">
        {evaluated.map((f) => (
          <div className="rb-consequence-alt" key={f.alternativeKind}>
            <div className="rb-consequence-alt-title">{label[f.alternativeKind]}</div>

            {/* F1 — estimated gross sale value */}
            <ConsequenceRow
              lbl="Est. gross sale value"
              val={
                f.estimatedGrossSaleValue.value == null
                  ? "—"
                  : `${fmtMoney(f.estimatedGrossSaleValue.value)}${spotFreshnessSuffix()}`
              }
              title={SELL_VALUE_DISCLAIMER}
            />

            {/* F3 — estimated gross opening premium */}
            {f.estimatedGrossOpeningPremium.value != null && (
              <ConsequenceRow
                lbl="Est. gross opening premium"
                val={`${fmtMoney(f.estimatedGrossOpeningPremium.value)}${chainAgeSuffix(f.estimatedGrossOpeningPremium.provenance)}`}
                title={OPENING_PREMIUM_DISCLAIMER}
              />
            )}

            {/* F2 — time to represented contractual boundary */}
            <ConsequenceRow
              lbl="Exposure duration"
              val={
                f.timeToContractualBoundaryDays == null
                  ? f.nextDecisionBoundary.kind === "now"
                    ? "immediate"
                    : "open-ended"
                  : `${f.timeToContractualBoundaryDays}d to boundary`
              }
              title="Time to the represented contractual boundary. Not capital lockup — BTC/roll/unwind/sell-subject-to-close can change it."
            />

            {/* F4 — downside envelope */}
            <ConsequenceRow
              lbl="Downside"
              val={f.downsideEnvelope.hasProtectiveFloorAboveZero ? "protective floor" : "no protective floor"}
              title={f.downsideEnvelope.note}
            />

            {/* F5 — retained participation */}
            <ConsequenceRow
              lbl="Retained upside"
              val={
                f.retainedParticipation.kind === "full"
                  ? "full"
                  : f.retainedParticipation.kind === "none"
                    ? "none"
                    : f.retainedParticipation.roomToStrikePerShare != null
                      ? formatRoomToStrike(f.retainedParticipation.roomToStrikePerShare)
                      : "capped at strike"
              }
              title={f.retainedParticipation.note}
            />

            {/* F8 — basis-relative RELEASE effect (Sell only; never exact in v1) */}
            <ConsequenceRow
              lbl="Basis-relative release effect"
              val={
                f.basisRelativeReleaseEffect.precision === "not-applicable"
                  ? "n/a (no release)"
                  : f.basisRelativeReleaseEffect.value == null
                    ? "unavailable"
                    : `${fmtMoney(f.basisRelativeReleaseEffect.value)} (approx)`
              }
              title={f.basisRelativeReleaseEffect.note}
            />

            {/* F6 — resulting holding / F7 — next decision boundary */}
            <div className="rb-consequence-outcome" title="Resulting holding for the evaluated block.">
              {f.resultingHolding.immediate && <div>{f.resultingHolding.immediate}</div>}
              {f.resultingHolding.ifHeldThroughExpiration.map((b, i) => (
                <div key={i}>{b}</div>
              ))}
              {f.resultingHolding.earlierExits.length > 0 && (
                <details className="rb-consequence-exits">
                  <summary>earlier exits</summary>
                  {f.resultingHolding.earlierExits.map((e, i) => (
                    <div key={i}>{e}</div>
                  ))}
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ConsequenceRow({ lbl, val, title }: { lbl: string; val: string; title: string }) {
  return (
    <div className="rb-consequence-row" title={title}>
      <span className="rb-consequence-lbl">{lbl}</span>
      <span className="rb-consequence-val">{val}</span>
    </div>
  );
}
