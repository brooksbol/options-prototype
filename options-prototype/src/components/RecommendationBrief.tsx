/**
 * Wheelwright Recommendation Brief — Right-side drawer.
 *
 * The final inspection bench before committing capital.
 * INVARIANT: Makes zero provider calls. All content from cache + runtime state.
 */

import { useEffect, useState } from "react";
import { buildWheelwrightBrief, type WheelwrightBriefViewModel, type TablePositionContext, type NeighborTag } from "../write-desk/brief-builder";
import { getDurableCache } from "../cache/durable-cache";
import { buildWriteIntent } from "../execution/write-intent";
import { buildFidelityTradeLink, type FidelityTradeLink } from "../execution/fidelity-trade-link";
import { hasWorkingIntent, getWorkingIntentsForSymbol, type PendingIntent } from "../execution/pending-intent";
import type { PutCandidate } from "../write-desk/scan-orchestrator";
import type { PortfolioSnapshot } from "../write-desk/types";
import type { RecommendationPolicy } from "../write-desk/recommend";
import type { MarketSessionClassification } from "../market-session/session-policy";
import type { GovernanceAnnotation } from "../write-desk/scan-orchestrator";

// --- Governance Explanation Helpers (deterministic, no LLM) ---

function governanceDangerTitle(gov: GovernanceAnnotation): string {
  const parts: string[] = [];
  if (gov.classification?.leveraged) parts.push("Leveraged");
  if (gov.classification?.inverse) parts.push("Inverse");
  if (gov.classification?.dailyReset) parts.push("Daily-Reset");
  if (parts.length === 0) return "Structural Complexity";
  return `${parts.join(" ")} Product`;
}

function governanceDangerExplanation(gov: GovernanceAnnotation): string {
  const c = gov.classification;
  if (!c) return gov.reason;

  if (c.leveraged && c.dailyReset && !c.inverse) {
    return "This instrument seeks a multiple of an underlying benchmark's daily return and resets exposure each trading day. Daily reset and compounding can cause performance over longer periods to differ materially from the stated daily multiple. Assignment may create exposure unsuitable for the standard cash-secured-put lifecycle.";
  }
  if (c.inverse && c.dailyReset) {
    return "This instrument seeks the inverse of an underlying benchmark's daily return and resets exposure each trading day. Holding inverse daily-reset products beyond the intended daily horizon can produce unexpected losses from compounding. Assignment creates inverse exposure unsuitable for standard covered strategies.";
  }
  if (c.leveraged && !c.dailyReset) {
    return "This instrument provides leveraged exposure to an underlying benchmark. Leveraged products amplify both gains and losses. Assignment may create concentrated leveraged exposure unsuitable for the standard cash-secured-put lifecycle.";
  }
  if (c.inverse && !c.dailyReset) {
    return "This instrument provides inverse exposure to an underlying benchmark. Assignment creates a position that profits from market decline, which conflicts with the standard income-oriented operating model.";
  }
  return gov.reason;
}

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

      {/* === DECISION SUMMARY — dominates the drawer === */}
      <section className="rb-decision-summary">
        <div className="rb-action-label">SELL TO OPEN</div>
        <div className="rb-action-contract">
          {brief.identity.symbol} {formatExpiration(brief.identity.expiration)} ${brief.identity.strike} Put
        </div>

        <div className="rb-decision-hero">
          <div className="rb-hero-row">
            <span className="rb-hero-label">Bid</span>
            <span className="rb-hero-value">${brief.decision.bid.toFixed(2)}</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Annualized</span>
            <span className="rb-hero-value">
              {brief.decision.yieldAnnualized != null ? `${brief.decision.yieldAnnualized.toFixed(1)}%` : "—"}
            </span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Cash Required</span>
            <span className="rb-hero-value">${brief.decision.cashRequired.toLocaleString()}</span>
          </div>
          <div className={`rb-hero-row rb-hero-fit rb-fit-${brief.deltaFit.category}`}>
            <span className="rb-hero-label">Policy Fit</span>
            <span className="rb-hero-value">{brief.deltaFit.label}</span>
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

        {/* Rank vs Position */}
        <div className="rb-rank-block">
          <div className="rb-rank-row">
            <span className={`rb-posture rb-posture-${brief.identity.posture.toLowerCase()}`}>
              {brief.identity.posture}
            </span>
            <span className="rb-rank-primary">Recommendation #{brief.identity.rank}</span>
          </div>
          {brief.tablePosition && !isRecommendationSort(brief.tablePosition.sortedBy) && (
            <div className="rb-rank-row rb-rank-secondary">
              <span className="rb-table-pos">
                Table Position #{brief.tablePosition.tablePosition}
              </span>
              <span className="rb-sort-context">
                Sorted by {brief.tablePosition.sortLabel}
              </span>
            </div>
          )}
          <div className="rb-rank-objective">{brief.identity.rankingObjective}</div>
        </div>
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

      {/* === EXECUTION HANDOFF === */}
      <FidelityHandoff candidate={candidate} onOrderConfirmed={onOrderConfirmed} />

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
                  <td>{c.yieldAnnualized != null ? `${c.yieldAnnualized.toFixed(1)}%` : "—"}</td>
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

// --- Helpers ---

function formatExpiration(iso: string): string {
  // "2026-07-31" → "Jul 31"
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isRecommendationSort(key: string): boolean {
  return key === "rank";
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
