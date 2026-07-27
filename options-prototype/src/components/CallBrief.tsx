/**
 * Call Inspection Drawer
 *
 * Right-side drawer for inspecting a covered-call candidate.
 * First Horizon B increment. Analogous to RecommendationBrief (put drawer).
 *
 * Sections:
 * - Identity (symbol, name, contract)
 * - Decision Summary (mid, premium, yield, max contracts)
 * - Position Context (basis, underlying price, unrealized, shares)
 * - Execution Evidence (delta fit, spread, OI, volume)
 * - Strike Neighborhood (5 calls around selected)
 * - Provenance (session state, evidence source)
 */

import { useState, useEffect } from "react";
import { getDurableCache } from "../cache/durable-cache";
import { buildCallBrief, type CallBriefViewModel, type CallNeighborTag } from "../write-desk/call-brief-builder";
import type { CallCandidate } from "../write-desk/scan-orchestrator";
import type { RecommendationPolicy } from "../write-desk/recommend";
import type { MarketSessionClassification } from "../market-session/session-policy";

// --- Props ---

interface CallBriefProps {
  candidate: CallCandidate;
  policy: RecommendationPolicy;
  sessionClassification: MarketSessionClassification;
  cacheEnvironment: { provider: string; environment: string };
  onClose: () => void;
}

// --- Component ---

export function CallBrief({
  candidate,
  policy,
  sessionClassification,
  cacheEnvironment,
  onClose,
}: CallBriefProps) {
  const [brief, setBrief] = useState<CallBriefViewModel | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cache = getDurableCache();
    buildCallBrief(candidate, policy, sessionClassification, cache, cacheEnvironment)
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

  return (
    <div className="rb-drawer" role="complementary" aria-label="Call Inspection Brief">
      <button className="rb-close" onClick={onClose} aria-label="Close drawer">&times;</button>

      {/* === IDENTITY === */}
      <header className="rb-header">
        <div className="rb-symbol">{brief.identity.symbol}</div>
        {brief.identity.name && <div className="rb-instrument-name">{brief.identity.name}</div>}
        <div className="rb-contract">
          ${brief.identity.strike} Call &middot; {formatExpiration(brief.identity.expiration)} &middot; {brief.identity.dte} DTE
        </div>
      </header>

      {/* === DECISION SUMMARY === */}
      <section className="rb-decision-summary">
        <div className="rb-action-label">SELL TO OPEN</div>
        <div className="rb-action-contract">
          {brief.identity.symbol} {formatExpiration(brief.identity.expiration)} ${brief.identity.strike} Call
        </div>

        <div className="rb-decision-hero">
          <div className="rb-hero-row">
            <span className="rb-hero-label">Mid</span>
            <span className="rb-hero-value">${brief.decision.mid.toFixed(2)}</span>
          </div>
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Premium (1 ct)</span>
            <span className="rb-hero-value">${brief.decision.premiumPerContract.toFixed(0)}</span>
          </div>
          {brief.decision.maxContracts > 1 && (
            <div className="rb-hero-row rb-hero-primary">
              <span className="rb-hero-label">Premium ({brief.decision.maxContracts} cts)</span>
              <span className="rb-hero-value">${(brief.decision.premiumPerContract * brief.decision.maxContracts).toFixed(0)}</span>
            </div>
          )}
          <div className="rb-hero-row rb-hero-primary">
            <span className="rb-hero-label">Annualized</span>
            <span className="rb-hero-value">
              {brief.decision.yieldAnnualized != null ? `${brief.decision.yieldAnnualized.toFixed(1)}%` : "\u2014"}
            </span>
          </div>
          <div className={`rb-hero-row rb-hero-fit rb-fit-${brief.deltaFit.category}`}>
            <span className="rb-hero-label">Policy Fit</span>
            <span className="rb-hero-value">{brief.deltaFit.label}</span>
          </div>
          <div className="rb-hero-row">
            <span className="rb-hero-label">Strike vs Price</span>
            <span className="rb-hero-value">
              {brief.decision.strikeAbovePrice ? "OTM" : "ITM"}
              {" "}(${brief.identity.strike} / ${brief.positionContext.underlyingPrice.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Rank */}
        <div className="rb-rank-block">
          <div className="rb-rank-row">
            <span className={`rb-posture rb-posture-${brief.identity.posture.toLowerCase()}`}>
              {brief.identity.posture}
            </span>
            <span className="rb-rank-primary">Recommendation #{brief.identity.rank}</span>
          </div>
        </div>
      </section>

      {/* === POSITION CONTEXT === */}
      <section className="rb-section">
        <h4 className="rb-section-title">Position Context</h4>
        <div className="rb-impact-grid">
          <div className="rb-impact-row">
            <span className="rb-impact-label">Available shares</span>
            <span className="rb-impact-val">{brief.positionContext.freeShares}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Max contracts</span>
            <span className="rb-impact-val">{brief.positionContext.maxContracts}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Underlying price</span>
            <span className="rb-impact-val">${brief.positionContext.underlyingPrice.toFixed(2)}</span>
          </div>
          {brief.positionContext.averageCostPerShare != null && (
            <div className="rb-impact-row">
              <span className="rb-impact-label">Avg cost/share</span>
              <span className="rb-impact-val">${brief.positionContext.averageCostPerShare.toFixed(2)}</span>
            </div>
          )}
          {brief.positionContext.unrealizedPerShare != null && (
            <div className={`rb-impact-row${brief.positionContext.unrealizedPerShare >= 0 ? " rb-gain" : " rb-loss"}`}>
              <span className="rb-impact-label">Unrealized/share</span>
              <span className="rb-impact-val">
                {brief.positionContext.unrealizedPerShare >= 0 ? "+" : ""}${brief.positionContext.unrealizedPerShare.toFixed(2)}
              </span>
            </div>
          )}
          {brief.positionContext.unrealizedTotal != null && (
            <div className={`rb-impact-row rb-impact-emphasis${brief.positionContext.unrealizedTotal >= 0 ? " rb-gain" : " rb-loss"}`}>
              <span className="rb-impact-label">Unrealized total</span>
              <span className="rb-impact-val">
                {brief.positionContext.unrealizedTotal >= 0 ? "+" : ""}${brief.positionContext.unrealizedTotal.toFixed(0)}
              </span>
            </div>
          )}
        </div>
      </section>

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
                <th>&Delta;</th>
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
                  <td>{c.delta.toFixed(2)}</td>
                  <td>${c.bid.toFixed(2)}</td>
                  <td>{c.spreadPercent.toFixed(0)}%</td>
                  <td>{c.openInterest.toLocaleString()}</td>
                  <td>{c.yieldAnnualized != null ? `${c.yieldAnnualized.toFixed(1)}%` : "\u2014"}</td>
                  <td><span className={`rb-tag rb-tag-${tagClass(c.tag)}`} title={tagTooltip(c.tag)}>{tagLabel(c.tag)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

function tagLabel(tag: CallNeighborTag): string {
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
    case "LOWER_YIELD": return "Lower yield";
    case "LOWER_EXEC": return "Lower exec";
  }
}

function tagClass(tag: CallNeighborTag): string {
  switch (tag) {
    case "SELECTED": return "selected";
    case "HIGH_DELTA":
    case "LOW_DELTA":
    case "OUTSIDE_TARGET": return "caution";
    case "LOW_PREMIUM":
    case "WIDE_SPREAD":
    case "LOW_OI":
    case "NO_GREEKS":
    case "EXCLUDED": return "excluded";
    case "LOWER_YIELD":
    case "LOWER_EXEC": return "alternative";
  }
}

function tagTooltip(tag: CallNeighborTag): string {
  switch (tag) {
    case "SELECTED": return "Currently selected contract";
    case "HIGH_DELTA": return "Delta above admissible range — high assignment probability";
    case "LOW_DELTA": return "Delta below admissible range — low premium";
    case "OUTSIDE_TARGET": return "Admissible but farther from target delta";
    case "LOW_PREMIUM": return "Zero or negligible bid — no actionable premium";
    case "WIDE_SPREAD": return "Spread too wide for reliable execution";
    case "LOW_OI": return "Low open interest — liquidity concern";
    case "NO_GREEKS": return "No greek data available — cannot assess delta";
    case "EXCLUDED": return "Excluded by policy constraints";
    case "LOWER_YIELD": return "Valid alternative with lower annualized yield";
    case "LOWER_EXEC": return "Valid alternative with lower execution score";
  }
}
