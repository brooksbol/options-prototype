/**
 * Buy-Write Recommendation Drawer
 *
 * Right-side drawer for inspecting a buy-write candidate.
 * Shows composite economics (premium + appreciation), strike neighborhood,
 * execution evidence, governance, provenance, and Fidelity handoff.
 *
 * INVARIANT: Makes zero provider calls. All content from cache + runtime state.
 */

import { useState, useEffect } from "react";
import { getDurableCache } from "../cache/durable-cache";
import { buildBuyWriteBrief, type BuyWriteBriefViewModel, type BuyWriteNeighborTag } from "../write-desk/buy-write-brief-builder";
import { PostureExplanationSection } from "./RecommendationBrief";
import type { BuyWriteCandidate } from "../write-desk/recommend-buy-writes";
import type { RecommendationPolicy } from "../write-desk/recommend";
import type { MarketSessionClassification } from "../market-session/session-policy";
import { lookupDescription } from "../instrument-catalog/catalog";
import {
  governanceDangerTitle,
  governanceDangerExplanation,
  governanceReviewTitle,
  governanceReviewExplanation,
  governanceUnknownTitle,
  governanceUnknownExplanation,
  governanceTaxonomyLine,
} from "../write-desk/governance-explanation";

// --- Props ---

interface BuyWriteBriefProps {
  candidate: BuyWriteCandidate;
  policy: RecommendationPolicy;
  sessionClassification: MarketSessionClassification;
  cacheEnvironment: { provider: string; environment: string };
  onClose: () => void;
}

// --- Component ---

export function BuyWriteBrief({
  candidate,
  policy,
  sessionClassification,
  cacheEnvironment,
  onClose,
}: BuyWriteBriefProps) {
  const [brief, setBrief] = useState<BuyWriteBriefViewModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cache = getDurableCache();
    buildBuyWriteBrief(candidate, policy, sessionClassification, cache, cacheEnvironment)
      .then((vm) => { if (!cancelled) setBrief(vm); });
    return () => { cancelled = true; };
  }, [candidate, policy, sessionClassification, cacheEnvironment]);

  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!brief) return <div className="rb-drawer rb-loading">Loading...</div>;

  const econ = brief.economics;

  return (
    <div className="rb-drawer" role="complementary" aria-label="Buy-Write Recommendation Brief">
      <button className="rb-close" onClick={onClose} aria-label="Close drawer">&times;</button>

      {/* === IDENTITY === */}
      <header className="rb-header">
        <div className="rb-symbol">{brief.identity.symbol}</div>
        {brief.identity.name && <div className="rb-instrument-name">{brief.identity.name}</div>}
        <div className="rb-contract">
          Buy 100 shares + Sell ${brief.identity.strike} Call &middot; {formatExpiration(brief.identity.expiration)} &middot; {brief.identity.dte} DTE
        </div>
      </header>

      {/* === INSTRUMENT DESCRIPTION === */}
      {(() => {
        const desc = lookupDescription(brief.identity.symbol);
        return desc ? <p className="rb-instrument-description">{desc}</p> : null;
      })()}

      {/* === DECISION SUMMARY === */}
      <section className="rb-decision-summary">
        <div className="rb-action-label">BUY SHARES / SELL CALL</div>
        <div className="rb-action-contract">
          Buy 100 {brief.identity.symbol} @ ${brief.decision.underlyingPrice.toFixed(2)} + Sell {formatExpiration(brief.identity.expiration)} ${brief.identity.strike} Call
        </div>

        <div className="rb-decision-hero">
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Net Debit</span>
            <span className="rb-hero-value">${econ.netDebitTotal.toFixed(0)} (${econ.netDebitPerShare.toFixed(2)}/sh)</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Call Premium (1 ct)</span>
            <span className="rb-hero-value">${econ.callPremiumPerContract.toFixed(0)}</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Premium Yield</span>
            <span className="rb-hero-value">{econ.premiumYieldAnnualized.toFixed(1)}% ann.</span>
          </div>
          <div className={`rb-hero-row rb-hero-primary${econ.appreciationPerShare < 0 ? " rb-loss" : " rb-gain"}`}>
            <span className="rb-hero-label">Appreciation to Strike</span>
            <span className="rb-hero-value">
              {econ.appreciationPerShare >= 0 ? "+" : ""}${econ.appreciationPerShare.toFixed(2)}/sh ({econ.appreciationPercent.toFixed(1)}%)
            </span>
          </div>
          <div className={`rb-hero-row rb-hero-primary${econ.totalGainPerShareIfAssigned < 0 ? " rb-loss" : " rb-gain"}`}>
            <span className="rb-hero-label">Total If Called Away</span>
            <span className="rb-hero-value">
              {econ.totalGainPerShareIfAssigned >= 0 ? "+" : "-"}${Math.abs(econ.totalGainIfAssigned).toFixed(0)} ({econ.totalGainPerShareIfAssigned >= 0 ? "+" : ""}${econ.totalGainPerShareIfAssigned.toFixed(2)}/sh &middot; {econ.totalReturnIfAssignedAnnualized.toFixed(1)}% ann.)
            </span>
          </div>
          {candidate.fullCycleHarvest != null && (
            <div className="rb-hero-row rb-hero-primary">
              <span className="rb-hero-label">Full-Cycle Harvest (v1)</span>
              <span className="rb-hero-value">${candidate.fullCycleHarvest.toFixed(2)}/sh (δ × total)</span>
            </div>
          )}
          {candidate.maxFCH != null && candidate.maxFCH > 0 && (
            <div className="rb-hero-row">
              <span className="rb-hero-label">v1 Diagnostic</span>
              <span className="rb-hero-value">
                max ${candidate.maxFCH.toFixed(2)} · sacrifice {candidate.fchSacrificePercent.toFixed(1)}%
              </span>
            </div>
          )}
          {candidate.selectionPv0 != null && (
            <div className="rb-hero-row rb-hero-primary">
              <span className="rb-hero-label">Production v0</span>
              <span className="rb-hero-value">{candidate.selectionPv0.toFixed(1)}%/mo</span>
            </div>
          )}
          {candidate.eligibleStrikeCount != null && candidate.eligibleStrikeCount > 0 && (
            <div className="rb-hero-row">
              <span className="rb-hero-label">Strike Selection</span>
              <span className="rb-hero-value">{candidate.eligibleStrikeCount} evaluated · δ {candidate.evaluatedDeltaMin?.toFixed(2)}–{candidate.evaluatedDeltaMax?.toFixed(2)} · prem/tot {(candidate.premiumShare * 100).toFixed(0)}%</span>
            </div>
          )}
          <div className={`rb-hero-row rb-hero-fit rb-fit-${brief.deltaFit.category}`}>
            <span className="rb-hero-label">Policy Fit</span>
            <span className="rb-hero-value">{brief.deltaFit.label}</span>
          </div>
        </div>

        {/* Posture Explanation */}
        <PostureExplanationSection explanation={brief.postureExplanation} />
      </section>

      {/* === CAPITAL EROSION WARNING === */}
      {!econ.strikeAbovePrice && (
        <section className="rb-section rb-erosion-warning">
          <h4 className="rb-section-title">⚠ Capital Erosion</h4>
          <p className="rb-erosion-text">
            The call strike (${econ.callStrike}) is <strong>below</strong> the acquisition price (${econ.underlyingPrice.toFixed(2)}).
            If assigned, you accept a planned capital loss of <strong>${Math.abs(econ.appreciationPerShare).toFixed(2)}/share</strong> offset by premium income of ${econ.callPremiumPerShare.toFixed(2)}/share.
          </p>
          {econ.totalGainPerShareIfAssigned >= 0 ? (
            <p className="rb-erosion-net rb-gain">Net outcome if assigned: +${econ.totalGainPerShareIfAssigned.toFixed(2)}/share (premium exceeds capital loss)</p>
          ) : (
            <p className="rb-erosion-net rb-loss">Net outcome if assigned: -${Math.abs(econ.totalGainPerShareIfAssigned).toFixed(2)}/share (premium does NOT cover capital loss)</p>
          )}
        </section>
      )}

      {/* === COMPOSITE ECONOMICS === */}
      <section className="rb-section">
        <h4 className="rb-section-title">Composite Economics</h4>
        <div className="rb-impact-grid">
          <div className="rb-impact-row">
            <span className="rb-impact-label">Purchase cost (100 sh)</span>
            <span className="rb-impact-val">${econ.capitalRequired.toLocaleString()}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Premium received</span>
            <span className="rb-impact-val rb-gain">+${econ.callPremiumPerContract.toFixed(0)}</span>
          </div>
          <div className="rb-impact-row rb-impact-emphasis">
            <span className="rb-impact-label">Effective basis</span>
            <span className="rb-impact-val">${econ.effectiveBasis.toFixed(2)}/sh</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Breakeven</span>
            <span className="rb-impact-val">${econ.breakeven.toFixed(2)}</span>
          </div>
          <div className={`rb-impact-row${econ.appreciationPerShare >= 0 ? " rb-gain" : " rb-loss"}`}>
            <span className="rb-impact-label">Appreciation to strike</span>
            <span className="rb-impact-val">{econ.appreciationPerShare >= 0 ? "+" : ""}${econ.appreciationPerShare.toFixed(2)}/sh</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Premium contribution</span>
            <span className="rb-impact-val">+${econ.callPremiumPerShare.toFixed(2)}/sh</span>
          </div>
          <div className={`rb-impact-row rb-impact-emphasis${econ.totalGainPerShareIfAssigned >= 0 ? " rb-gain" : " rb-loss"}`}>
            <span className="rb-impact-label">Total gain if assigned</span>
            <span className="rb-impact-val">{econ.totalGainPerShareIfAssigned >= 0 ? "+" : ""}${econ.totalGainIfAssigned.toFixed(0)} (${econ.totalGainPerShareIfAssigned.toFixed(2)}/sh)</span>
          </div>
          <div className={`rb-impact-row rb-impact-emphasis${econ.totalReturnIfAssignedAnnualized >= 0 ? " rb-gain" : " rb-loss"}`}>
            <span className="rb-impact-label">Total return (ann.)</span>
            <span className="rb-impact-val">{econ.totalReturnIfAssignedAnnualized.toFixed(1)}%</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Max loss exposure</span>
            <span className="rb-impact-val">${econ.maxLossPerShare.toFixed(2)}/sh (if shares → $0)</span>
          </div>
        </div>
      </section>

      {/* === GOVERNANCE === */}
      {brief.governance.status !== "authorized" && (
        <section className="rb-section rb-governance">
          <h4 className="rb-section-title">Governance</h4>
          <div className={`rb-gov-badge rb-gov-${brief.governance.status}`}>
            {brief.governance.status === "danger" && "⚠ "}
            {brief.governance.status === "unknown" && "? "}
            <span className="rb-gov-title">
              {brief.governance.status === "danger"
                ? governanceDangerTitle(brief.governance)
                : brief.governance.status === "review"
                  ? governanceReviewTitle()
                  : governanceUnknownTitle()
              }
            </span>
          </div>
          <p className="rb-gov-explanation">
            {brief.governance.status === "danger"
              ? governanceDangerExplanation(brief.governance)
              : brief.governance.status === "review"
                ? governanceReviewExplanation()
                : governanceUnknownExplanation()
            }
          </p>
          {governanceTaxonomyLine(brief.governance) && (
            <div className="rb-gov-taxonomy">{governanceTaxonomyLine(brief.governance)}</div>
          )}
        </section>
      )}

      {/* === EXECUTION EVIDENCE === */}
      <section className="rb-section rb-evidence">
        <h4 className="rb-section-title">Execution Evidence</h4>
        <div className="rb-evidence-grid">
          <div className="rb-ev-row">
            <span className="rb-ev-label">Delta</span>
            <span className="rb-ev-value">{brief.decision.delta.toFixed(2)}</span>
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
        <h4 className="rb-section-title">Call Strike Neighborhood</h4>
        {brief.neighborhood.coverageGap ? (
          <p className="rb-gap">Additional chain evidence required</p>
        ) : brief.neighborhood.contracts.length === 0 ? (
          <p className="rb-gap">No neighborhood data</p>
        ) : (
          <table className="rb-neighborhood-table">
            <thead>
              <tr>
                <th>Strike</th>
                <th>&Delta;</th>
                <th>Bid</th>
                <th>Spr%</th>
                <th>OI</th>
                <th>Prem%</th>
                <th>Total%</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {brief.neighborhood.contracts.map((c) => (
                <tr key={c.strike} className={c.isSelected ? "rb-nh-selected" : ""}>
                  <td className={`${c.isSelected ? "rb-nh-strike-sel" : ""}${!c.strikeAbovePrice ? " rb-warn" : ""}`}>${c.strike}</td>
                  <td>{c.delta.toFixed(2)}</td>
                  <td>${c.bid.toFixed(2)}</td>
                  <td>{c.spreadPercent.toFixed(0)}%</td>
                  <td>{c.openInterest.toLocaleString()}</td>
                  <td>{c.premiumYieldAnnualized.toFixed(1)}%</td>
                  <td className={c.totalReturnAnnualized < 0 ? "rb-warn" : ""}>{c.totalReturnAnnualized.toFixed(1)}%</td>
                  <td><span className={`rb-tag rb-tag-${tagClass(c.tag)}`} title={tagTooltip(c.tag)}>{tagLabel(c.tag)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* === FIDELITY HANDOFF === */}
      <section className="rb-section">
        <h4 className="rb-section-title">Execute in Fidelity</h4>
        <div className="rb-bw-fidelity-card">
          <div className="rb-bw-card-row"><span className="rb-bw-card-label">Strategy</span><span className="rb-bw-card-value">Buy Write</span></div>
          <div className="rb-bw-card-row"><span className="rb-bw-card-label">Leg 1</span><span className="rb-bw-card-value">Buy {brief.fidelityCard.sharesQty} shares {brief.fidelityCard.symbol}</span></div>
          <div className="rb-bw-card-row"><span className="rb-bw-card-label">Leg 2</span><span className="rb-bw-card-value">Sell 1 {brief.fidelityCard.symbol} {formatExpiration(brief.fidelityCard.callExpiration)} ${brief.fidelityCard.callStrike} Call</span></div>
          <div className="rb-bw-card-row"><span className="rb-bw-card-label">Order</span><span className="rb-bw-card-value">Net Debit ${brief.fidelityCard.netDebitPerShare.toFixed(2)}</span></div>
          <div className="rb-bw-card-row rb-bw-card-total"><span className="rb-bw-card-label">Estimated Total</span><span className="rb-bw-card-value">${brief.fidelityCard.netDebitTotal.toFixed(2)}</span></div>
        </div>
        <a
          className="rb-handoff-link rb-bw-handoff-link"
          href={brief.fidelityCard.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Fidelity ↗
        </a>
        <p className="rb-bw-handoff-note">
          Symbol will be pre-populated. Select "Buy Write" strategy and fill legs from the card above.
        </p>
      </section>

      {/* === PROVENANCE === */}
      <section className="rb-section rb-provenance">
        <h4 className="rb-section-title">Evidence Provenance</h4>
        <div className="rb-prov-grid">
          <span>{brief.provenance.provider} &middot; {brief.provenance.canonicalSessionDate}</span>
          <span>{brief.provenance.sessionState} &middot; {brief.provenance.evidenceStatus}</span>
        </div>
      </section>
    </div>
  );
}

// --- Helpers ---

function formatExpiration(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tagLabel(tag: BuyWriteNeighborTag): string {
  switch (tag) {
    case "SELECTED": return "Selected";
    case "HIGH_DELTA": return "High \u0394";
    case "LOW_DELTA": return "Low \u0394";
    case "OUTSIDE_TARGET": return "Off-target";
    case "LOW_PREMIUM": return "Low prem";
    case "WIDE_SPREAD": return "Wide";
    case "LOW_OI": return "Low OI";
    case "NO_GREEKS": return "No greeks";
    case "EXCLUDED": return "Excluded";
    case "BELOW_PRICE": return "Below price";
    case "LOWER_YIELD": return "Lower rtn";
    case "LOWER_EXEC": return "Lower exec";
  }
}

function tagClass(tag: BuyWriteNeighborTag): string {
  switch (tag) {
    case "SELECTED": return "selected";
    case "BELOW_PRICE": return "warn";
    case "WIDE_SPREAD": return "warn";
    case "LOW_OI": return "warn";
    case "LOW_PREMIUM": return "warn";
    case "NO_GREEKS": return "warn";
    case "HIGH_DELTA": return "neutral";
    case "LOW_DELTA": return "neutral";
    case "OUTSIDE_TARGET": return "neutral";
    case "EXCLUDED": return "excluded";
    case "LOWER_YIELD": return "neutral";
    case "LOWER_EXEC": return "neutral";
  }
}

function tagTooltip(tag: BuyWriteNeighborTag): string {
  switch (tag) {
    case "SELECTED": return "Currently selected contract";
    case "HIGH_DELTA": return "Delta above admissible range";
    case "LOW_DELTA": return "Delta below admissible range";
    case "OUTSIDE_TARGET": return "Outside target delta band";
    case "LOW_PREMIUM": return "Bid is zero or near-zero";
    case "WIDE_SPREAD": return "Spread exceeds exclusion floor";
    case "LOW_OI": return "Low open interest";
    case "NO_GREEKS": return "Greeks unavailable";
    case "EXCLUDED": return "Excluded by policy";
    case "BELOW_PRICE": return "Strike below acquisition price — planned capital loss";
    case "LOWER_YIELD": return "Lower total return than selected";
    case "LOWER_EXEC": return "Lower execution quality than selected";
  }
}
