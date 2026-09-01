/**
 * Wheelwright Recommendation Brief — Right-side drawer.
 *
 * The final inspection bench before committing capital.
 * INVARIANT: Makes zero provider calls. All content from cache + runtime state.
 */

import { useEffect, useState } from "react";
import { buildWheelwrightBrief, type WheelwrightBriefViewModel, type TablePositionContext, type NeighborTag } from "../write-desk/brief-builder";
import type { PostureExplanation } from "../write-desk/posture-explanation";
import { getDurableCache } from "../cache/durable-cache";
import { buildWriteIntent } from "../execution/write-intent";
import { buildFidelityTradeLink, type FidelityTradeLink } from "../execution/fidelity-trade-link";
import { hasWorkingIntent, getWorkingIntentsForSymbol, type PendingIntent } from "../execution/pending-intent";
import type { PutCandidate } from "../write-desk/scan-orchestrator";
import type { PortfolioSnapshot } from "../write-desk/types";
import type { RecommendationPolicy } from "../write-desk/recommend";
import type { MarketSessionClassification } from "../market-session/session-policy";
import type { ConditionedCallOpportunity, ConditionedCallSurface } from "../write-desk/conditioned-call-surface";
import { lookupDescription } from "../instrument-catalog/catalog";
import {
  governanceDangerTitle,
  governanceDangerExplanation,
} from "../write-desk/governance-explanation";

// --- Governance Explanation Helpers (delegated to shared module) ---
// governanceDangerTitle and governanceDangerExplanation are now imported from governance-explanation.ts

interface RecommendationBriefProps {
  candidate: PutCandidate;
  policy: RecommendationPolicy;
  portfolio: PortfolioSnapshot;
  sessionClassification: MarketSessionClassification;
  cacheEnvironment: { provider: string; environment: string };
  tablePosition: TablePositionContext | null;
  pendingIntents: PendingIntent[];
  onClose: () => void;
  onOrderConfirmed?: (candidate: PutCandidate) => void;
}

export function RecommendationBrief({
  candidate,
  policy,
  portfolio,
  sessionClassification,
  cacheEnvironment,
  tablePosition,
  pendingIntents,
  onClose,
  onOrderConfirmed,
}: RecommendationBriefProps) {
  const [brief, setBrief] = useState<WheelwrightBriefViewModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cache = getDurableCache();
    buildWheelwrightBrief(candidate, policy, portfolio, sessionClassification, cache, cacheEnvironment, tablePosition)
      .then((vm) => { if (!cancelled) setBrief(vm); });
    return () => { cancelled = true; };
  }, [candidate, policy, portfolio, sessionClassification, cacheEnvironment, tablePosition]);

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!brief) return <div className="rb-drawer rb-loading">Loading...</div>;

  return (
    <div className="rb-drawer" role="complementary" aria-label="Wheelwright Recommendation Brief">
      <button className="rb-close" onClick={onClose} aria-label="Close drawer">×</button>

      {/* === IDENTITY === */}
      <header className="rb-header">
        <div className="rb-symbol">{brief.identity.symbol}</div>
        {brief.identity.name && <div className="rb-instrument-name">{brief.identity.name}</div>}
        <div className="rb-contract">
          ${brief.identity.strike} Put · {formatExpiration(brief.identity.expiration)} · {brief.identity.dte} DTE
        </div>
      </header>

      {/* === INSTRUMENT DESCRIPTION (from catalog, presentation only) === */}
      {(() => {
        const desc = lookupDescription(brief.identity.symbol);
        return desc ? <p className="rb-instrument-description">{desc}</p> : null;
      })()}

      {/* === EXECUTION HANDOFF (immediately accessible) === */}
      <FidelityHandoff candidate={candidate} onOrderConfirmed={onOrderConfirmed} />

      {/* === DECISION SUMMARY — dominates the drawer === */}
      <section className="rb-decision-summary">
        <div className="rb-action-label">SELL TO OPEN</div>
        <div className="rb-action-contract">
          {brief.identity.symbol} {formatExpiration(brief.identity.expiration)} ${brief.identity.strike} Put
        </div>

        <div className="rb-decision-hero">
          <div className="rb-hero-row">
            <span className="rb-hero-label">Mid</span>
            <span className="rb-hero-value">${brief.decision.mid.toFixed(2)}</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Premium (1 ct)</span>
            <span className="rb-hero-value">${brief.decision.premiumAtMid.toFixed(0)}</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Annualized</span>
            <span className="rb-hero-value">
              {`${brief.decision.yieldAnnualized.toFixed(1)}%`}
            </span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Cash Required</span>
            <span className="rb-hero-value">${brief.decision.cashRequired.toLocaleString()}</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Cash After</span>
            <span className="rb-hero-value">${brief.positionImpact.cashRemainingAfter.toLocaleString()}</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Assignment Basis</span>
            <span className="rb-hero-value rb-basis">${brief.decision.effectiveCostBasis.toFixed(2)}</span>
          </div>
        </div>

        {/* Posture Explanation — replaces rank/table-position block */}
        <PostureExplanationSection explanation={brief.postureExplanation} />
      </section>

      {/* === PENDING EXPOSURE WARNING === */}
      {hasWorkingIntent(candidate.symbol, pendingIntents) && (
        <div className="rb-pending-warning">
          <span className="rb-pending-icon">⚠</span>
          <span className="rb-pending-text">
            {candidate.symbol} — pending broker order
          </span>
          {getWorkingIntentsForSymbol(candidate.symbol, pendingIntents).map((i) => (
            <span key={i.id} className="rb-pending-detail">
              ${i.strike} {i.optionType === "put" ? "P" : "C"} {i.expiration.slice(5)} × {i.quantity}
            </span>
          ))}
        </div>
      )}

      {/* === GOVERNANCE ANNOTATION === */}
      {candidate.governance.status !== "authorized" && (
        <section className={`rb-governance rb-governance-${candidate.governance.status}`}>
          <div className="rb-gov-header">
            <span className={`rb-gov-badge rb-gov-badge-${candidate.governance.status}`}>
              {candidate.governance.status === "danger" ? "DANGER" : candidate.governance.status === "review" ? "REVIEW" : "UNKNOWN"}
            </span>
            <span className="rb-gov-title">
              {candidate.governance.status === "danger"
                ? governanceDangerTitle(candidate.governance)
                : candidate.governance.status === "review"
                  ? "Non-Standard Product Structure"
                  : "Instrument Classification Unknown"
              }
            </span>
          </div>
          <p className="rb-gov-explanation">
            {candidate.governance.status === "danger"
              ? governanceDangerExplanation(candidate.governance)
              : candidate.governance.status === "review"
                ? "This instrument uses a non-standard structure that may behave differently from conventional equity ETFs. Assignment outcomes and holding-period characteristics require additional review before standard cash-secured-put authorization."
                : "Instrument structure could not be established from the available evidence. Standard authorization is withheld until sufficient classification evidence is available."
            }
          </p>
          <div className="rb-gov-evidence">
            {candidate.governance.classification && (
              <>
                <div className="rb-gov-row">
                  <span className="rb-gov-label">Product Structure</span>
                  <span className="rb-gov-value">
                    {[
                      candidate.governance.classification.leveraged && "Leveraged",
                      candidate.governance.classification.inverse && "Inverse",
                      candidate.governance.classification.dailyReset && "Daily-Reset",
                    ].filter(Boolean).join(", ") || "Undetermined"}
                  </span>
                </div>
                <div className="rb-gov-row">
                  <span className="rb-gov-label">Classification Confidence</span>
                  <span className="rb-gov-value">{candidate.governance.classification.confidence}</span>
                </div>
                <div className="rb-gov-row">
                  <span className="rb-gov-label">Classification Source</span>
                  <span className="rb-gov-value">{candidate.governance.classification.source}</span>
                </div>
              </>
            )}
            <div className="rb-gov-row">
              <span className="rb-gov-label">Policy Result</span>
              <span className="rb-gov-value">
                {candidate.governance.status === "danger"
                  ? "Not authorized for standard cash-secured-put operation"
                  : "Authorization withheld — insufficient evidence"
                }
              </span>
            </div>
          </div>
        </section>
      )}

      {/* === EVIDENCE: Delta & Execution === */}
      <section className="rb-section rb-evidence">
        <h4 className="rb-section-title">Execution Evidence</h4>
        <div className="rb-evidence-grid">
          <div className="rb-ev-row">
            <span className="rb-ev-label">Delta</span>
            <span className="rb-ev-value">{Math.abs(brief.decision.delta).toFixed(2)}</span>
            <span className="rb-ev-label">Target</span>
            <span className="rb-ev-value">{brief.deltaFit.targetDelta.toFixed(2)}</span>
            <span className={`rb-ev-deviation rb-dev-${brief.deltaFit.category}`}>
              {brief.deltaFit.deviation >= 0 ? "+" : ""}{brief.deltaFit.deviation.toFixed(2)}
            </span>
          </div>
          <div className="rb-ev-row">
            <span className="rb-ev-label">Spread</span>
            <span className={`rb-ev-value${brief.decision.spreadPercent > 15 ? " rb-warn" : ""}`}>
              {brief.decision.spreadPercent.toFixed(1)}%
            </span>
            <span className="rb-ev-label">OI</span>
            <span className={`rb-ev-value${brief.decision.openInterest < 50 ? " rb-warn" : ""}`}>
              {brief.decision.openInterest.toLocaleString()}
            </span>
            <span className="rb-ev-label">Vol</span>
            <span className="rb-ev-value">{brief.decision.volume}</span>
          </div>
          <div className="rb-ev-row">
            <span className="rb-ev-label">Bid</span>
            <span className="rb-ev-value">${brief.decision.bid.toFixed(2)}</span>
            <span className="rb-ev-label">Mid</span>
            <span className="rb-ev-value">${brief.decision.mid.toFixed(2)}</span>
            <span className="rb-ev-label">Ask</span>
            <span className="rb-ev-value">${brief.decision.ask.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* === STRIKE NEIGHBORHOOD === */}
      <section className="rb-section">
        <h4 className="rb-section-title">Strike Neighborhood</h4>
        {brief.neighborhood.coverageGap ? (
          <p className="rb-gap">Additional chain evidence required</p>
        ) : brief.neighborhood.contracts.length === 0 ? (
          <p className="rb-gap">No neighborhood data</p>
        ) : (
          <table className="rb-neighborhood-table">
            <thead>
              <tr>
                <th>Strike</th>
                <th>Δ</th>
                <th>Bid</th>
                <th>Spr%</th>
                <th>OI</th>
                <th>Yield</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {brief.neighborhood.contracts.map((c) => (
                <tr key={c.strike} className={c.isSelected ? "rb-nh-selected" : ""}>
                  <td className={c.isSelected ? "rb-nh-strike-sel" : ""}>${c.strike}</td>
                  <td>{Math.abs(c.delta).toFixed(2)}</td>
                  <td>${c.bid.toFixed(2)}</td>
                  <td>{c.spreadPercent.toFixed(0)}%</td>
                  <td>{c.openInterest.toLocaleString()}</td>
                  <td>{`${c.yieldAnnualized.toFixed(1)}%`}</td>
                  <td><span className={`rb-tag rb-tag-${tagClass(c.tag)}`} title={tagTooltip(c.tag)}>{tagLabel(c.tag)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* === POSITION IMPACT === */}
      <section className="rb-section">
        <h4 className="rb-section-title">Position Impact</h4>
        <div className="rb-impact-grid">
          <div className="rb-impact-row rb-impact-emphasis">
            <span className="rb-impact-label">Cash required</span>
            <span className="rb-impact-val">${brief.positionImpact.cashRequired.toLocaleString()}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Deployable before</span>
            <span className="rb-impact-val">${brief.positionImpact.deployableCashBefore.toLocaleString()}</span>
          </div>
          <div className="rb-impact-row rb-impact-emphasis">
            <span className="rb-impact-label">Remaining after</span>
            <span className="rb-impact-val">${brief.positionImpact.cashRemainingAfter.toLocaleString()}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">If assigned</span>
            <span className="rb-impact-val">100 shares @ ${brief.identity.strike}</span>
          </div>
          <div className="rb-impact-row rb-impact-emphasis">
            <span className="rb-impact-label">Cost basis</span>
            <span className="rb-impact-val rb-basis">${brief.positionImpact.effectiveCostBasis.toFixed(2)}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Call capacity</span>
            <span className="rb-impact-val">{brief.positionImpact.resultingCallCapacity} contract</span>
          </div>
          {brief.positionImpact.existingExposure.length > 0 && (
            <div className="rb-impact-exposure">
              <span className="rb-impact-label">Existing exposure</span>
              <div className="rb-exposure-list">
                {brief.positionImpact.existingExposure.map((e, i) => (
                  <span key={i} className="rb-exposure-chip">{e.type}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* === PROJECTED CALL SURFACE === */}
      <ProjectedCallSurfaceSection surface={brief.projectedCallSurface} effectiveCostBasis={brief.decision.effectiveCostBasis} strike={brief.identity.strike} />

      {/* === EVIDENCE PROVENANCE === */}
      <section className="rb-section rb-provenance">
        <h4 className="rb-section-title">Evidence Provenance</h4>
        <div className="rb-prov-grid">
          <span>{brief.provenance.provider} · {brief.provenance.canonicalSessionDate}</span>
          <span>{brief.provenance.sessionState} · {brief.provenance.evidenceStatus}</span>
        </div>
      </section>
    </div>
  );
}

// --- Fidelity Handoff ---

function FidelityHandoff({ candidate, onOrderConfirmed }: { candidate: PutCandidate; onOrderConfirmed?: (candidate: PutCandidate) => void }) {
  const intent = buildWriteIntent({ candidate });
  const link: FidelityTradeLink | null = intent ? buildFidelityTradeLink(intent) : null;

  if (!link) {
    return (
      <div className="rb-handoff rb-handoff-unavailable">
        <span className="rb-handoff-label">Broker handoff unavailable</span>
        <span className="rb-handoff-reason">Insufficient data to construct trade ticket</span>
      </div>
    );
  }

  return (
    <div className="rb-handoff">
      <div className="rb-handoff-actions">
        <a
          className="rb-handoff-link"
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Fidelity ↗
        </a>
        {onOrderConfirmed && (
          <button
            className="rb-handoff-confirm"
            onClick={() => onOrderConfirmed(candidate)}
          >
            Confirm Submitted
          </button>
        )}
      </div>
      <div className="rb-handoff-verify">
        <span className="rb-handoff-verify-label">Verify before submitting:</span>
        {link.requiresVerification.map((field) => (
          <span key={field} className="rb-handoff-verify-item">{field}</span>
        ))}
      </div>
    </div>
  );
}

// --- Posture Explanation Section ---

export function PostureExplanationSection({ explanation }: { explanation: PostureExplanation }) {
  const { posture, derivation, score, scoreRange, hardNoReasons, contributors, deltaFit, governance } = explanation;

  return (
    <div className="rb-posture-explanation">
      {/* Posture badge + classification rule */}
      <div className="rb-pe-header">
        <span className={`rb-posture rb-posture-${posture.toLowerCase()}`}>{posture}</span>
      </div>

      {derivation === "hard_no" ? (
        /* Hard-no path */
        <div className="rb-pe-hard-no">
          <div className="rb-pe-rule">Absolute exclusion:</div>
          {hardNoReasons.map((reason, i) => (
            <div key={i} className="rb-pe-hard-no-reason">{reason}</div>
          ))}
          <div className="rb-pe-hard-no-note">This contract was not assigned a normal execution posture.</div>
        </div>
      ) : (
        /* Normal weighted-score path */
        <>
          <div className="rb-pe-score-block">
            <div className="rb-pe-score-line">
              <span className="rb-pe-score-label">Execution quality:</span>
              <span className="rb-pe-score-value">{score} / 100</span>
            </div>
            {scoreRange && scoreRange.nextPosture && (
              <div className="rb-pe-threshold">
                {scoreRange.nextPosture} begins at {scoreRange.nextThreshold}
              </div>
            )}
            {scoreRange && !scoreRange.nextPosture && (
              <div className="rb-pe-threshold">
                {posture} begins at {scoreRange.lowerInclusive}
              </div>
            )}
          </div>

          {/* Score contributors */}
          <div className="rb-pe-contributors">
            <div className="rb-pe-contributors-label">Score contributors</div>
            {contributors.map((c) => (
              <div key={c.name} className="rb-pe-contributor">
                <div className="rb-pe-contrib-header">
                  <span className="rb-pe-contrib-name">{c.name}</span>
                  <span className="rb-pe-contrib-score">{c.componentScore} / 100</span>
                  <span className="rb-pe-contrib-weight">weight {Math.round(c.weight * 100)}%</span>
                </div>
                <div className="rb-pe-contrib-detail">
                  <span className="rb-pe-contrib-measured">{c.measuredLabel}</span>
                  <span className="rb-pe-contrib-reference">{c.referenceLabel}</span>
                </div>
                <div className="rb-pe-contrib-bar">
                  <div className="rb-pe-contrib-bar-fill" style={{ width: `${Math.min(c.componentScore, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Additional observations — separate from execution score */}
      <div className="rb-pe-observations">
        <div className="rb-pe-obs-item">{deltaFit.label}</div>
        {governance && (
          <div className={`rb-pe-obs-item${governance.hasRestriction ? " rb-pe-obs-warn" : ""}`}>{governance.summary}</div>
        )}
      </div>
    </div>
  );
}

// --- Projected Call Surface Section ---

function ProjectedCallSurfaceSection({ surface, effectiveCostBasis, strike }: {
  surface: ConditionedCallSurface | null;
  effectiveCostBasis: number;
  strike: number;
}) {
  if (!surface) return null;

  const premium = strike - effectiveCostBasis;

  // Unavailable state
  if (surface.evidenceState === "unavailable") {
    return (
      <section className="rb-section rb-pcs">
        <h4 className="rb-section-title">Projected Call Surface</h4>
        <div className="rb-pcs-conditional">IF ASSIGNED</div>
        <p className="rb-gap">{surface.evidenceStateReason ?? "Call surface evidence not available"}</p>
      </section>
    );
  }

  // Partial state note
  const partialNote = surface.evidenceState === "partial" ? surface.evidenceStateReason : null;

  // Freshness label
  const freshnessLabel = surface.evidenceFreshness === "current-session"
    ? "Current-session evidence"
    : surface.evidenceFreshness === "sealed-prior-session"
      ? "Sealed prior-session evidence"
      : surface.evidenceFreshness === "stale"
        ? "Stale evidence"
        : "Unknown freshness";

  return (
    <section className="rb-section rb-pcs">
      <h4 className="rb-section-title">Projected Call Surface</h4>
      <div className="rb-pcs-conditional">IF ASSIGNED</div>
      <div className="rb-pcs-basis">
        <span className="rb-pcs-basis-label">Projected basis:</span>
        <span className="rb-pcs-basis-value">${effectiveCostBasis.toFixed(2)}</span>
        <span className="rb-pcs-basis-derivation">(${strike} strike &minus; ${premium.toFixed(2)} premium)</span>
      </div>

      {partialNote && <p className="rb-pcs-partial">{partialNote}</p>}

      {/* Summary */}
      <div className="rb-pcs-summary">
        <span>{surface.summary.totalCallsQualifying} policy-admissible call{surface.summary.totalCallsQualifying !== 1 ? "s" : ""} above basis</span>
        <span className="rb-pcs-summary-detail">
          {surface.summary.expirationsWithChains} expiration{surface.summary.expirationsWithChains !== 1 ? "s" : ""} evaluated
          {surface.summary.totalCallsFailingPolicy > 0 && ` · ${surface.summary.totalCallsFailingPolicy} fail policy`}
        </span>
      </div>

      {/* Representative opportunities table */}
      {surface.representativeOpportunities.length > 0 ? (
        <>
          <div className="rb-pcs-table-label">Representative policy-admissible contracts above projected basis</div>
          <table className="rb-pcs-table">
            <thead>
              <tr>
                <th>Strike</th>
                <th>Exp</th>
                <th>DTE</th>
                <th>&Delta;</th>
                <th>Bid</th>
                <th>Ask</th>
                <th>Mid yield from basis</th>
                <th>+Basis</th>
              </tr>
            </thead>
            <tbody>
              {surface.representativeOpportunities.map((opp: ConditionedCallOpportunity) => (
                <tr key={`${opp.expiration}-${opp.strike}`}>
                  <td>${opp.strike}</td>
                  <td>{formatPcsExpiration(opp.expiration)}</td>
                  <td>{opp.dte}</td>
                  <td>{opp.delta.toFixed(2)}</td>
                  <td>${opp.bid.toFixed(2)}</td>
                  <td>${opp.ask.toFixed(2)}</td>
                  <td>{opp.yieldFromBasis != null ? `${opp.yieldFromBasis.toFixed(1)}%` : "\u2014"}</td>
                  <td>+${opp.strikeDistanceFromBasis.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="rb-pcs-empty">No policy-admissible calls currently above projected basis.</p>
      )}

      {/* PCS provenance */}
      <div className="rb-pcs-provenance">
        {surface.evidenceMetadata.provider} · {freshnessLabel}
      </div>
    </section>
  );
}

function formatPcsExpiration(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// --- Helpers ---

function formatExpiration(iso: string): string {
  // "2026-07-31" → "Jul 31"
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tagLabel(tag: NeighborTag): string {
  switch (tag) {
    case "SELECTED": return "★";
    case "HIGH_DELTA": return "HIGH Δ";
    case "LOW_DELTA": return "LOW Δ";
    case "OUTSIDE_TARGET": return "OFF TGT";
    case "LOW_PREMIUM": return "NO BID";
    case "WIDE_SPREAD": return "WIDE";
    case "LOW_OI": return "LOW OI";
    case "NO_GREEKS": return "NO Δ";
    case "EXCLUDED": return "EXCL";
    case "LOWER_YIELD": return "< YIELD";
    case "LOWER_EXEC": return "< EXEC";
  }
}

function tagClass(tag: NeighborTag): string {
  switch (tag) {
    case "SELECTED": return "selected";
    case "HIGH_DELTA":
    case "LOW_DELTA":
    case "OUTSIDE_TARGET": return "delta";
    case "LOW_PREMIUM":
    case "NO_GREEKS":
    case "EXCLUDED": return "hard";
    case "WIDE_SPREAD":
    case "LOW_OI": return "execution";
    case "LOWER_YIELD":
    case "LOWER_EXEC": return "soft";
  }
}

function tagTooltip(tag: NeighborTag): string {
  switch (tag) {
    case "SELECTED": return "Selected contract";
    case "HIGH_DELTA": return "Above admissible delta range";
    case "LOW_DELTA": return "Below admissible delta range";
    case "OUTSIDE_TARGET": return "Farther from target delta than selected";
    case "LOW_PREMIUM": return "Zero or negligible bid";
    case "WIDE_SPREAD": return "Spread exceeds execution threshold";
    case "LOW_OI": return "Insufficient open interest";
    case "NO_GREEKS": return "Missing Greeks data";
    case "EXCLUDED": return "Hard execution exclusion";
    case "LOWER_YIELD": return "Lower annualized yield than selected";
    case "LOWER_EXEC": return "Lower execution quality score";
  }
}
