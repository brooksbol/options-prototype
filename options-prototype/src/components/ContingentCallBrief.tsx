/**
 * Contingent Call Brief — Evidence drawer for assignment-contingent call opportunities.
 *
 * Displays when clicking an "If assigned" row in the Calls table.
 * Shows the projected call opportunity conditioned on assignment of an existing short put.
 *
 * This is NOT an executable recommendation. It is evidence about what call
 * opportunities would exist if the originating put assigns.
 *
 * Does NOT show:
 * - Executable posture (ACTIONABLE/EDGE/WAIT)
 * - Fidelity trade handoff
 * - Language implying shares are currently owned
 */

import { useEffect } from "react";
import type { ContingentCallRow } from "../write-desk/call-table-row";
import type { MarketSessionClassification } from "../market-session/session-policy";

// --- Props ---

interface ContingentCallBriefProps {
  row: ContingentCallRow;
  sessionClassification: MarketSessionClassification;
  cacheEnvironment: { provider: string; environment: string };
  onClose: () => void;
}

// --- Component ---

export function ContingentCallBrief({ row, sessionClassification, cacheEnvironment, onClose }: ContingentCallBriefProps) {
  // Keyboard: Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const freshnessLabel = sessionClassification.acceptingCanonicalEvidence
    ? "Current-session evidence"
    : sessionClassification.priorSessionOperationallyValid
      ? "Sealed prior-session evidence"
      : "Sealed evidence";

  return (
    <div className="rb-drawer" role="complementary" aria-label="Contingent Call Evidence">
      <button className="rb-close" onClick={onClose} aria-label="Close drawer">&times;</button>

      {/* === IDENTITY === */}
      <header className="rb-header">
        <div className="rb-symbol">{row.symbol}</div>
        <div className="rb-contract">
          ${row.strike} Call &middot; {formatExp(row.expiration)} &middot; {row.dte} DTE
        </div>
        <div className="rb-pcs-conditional" style={{ marginTop: '6px' }}>
          PROJECTED &middot; IF ASSIGNED
        </div>
      </header>

      {/* === ASSIGNMENT CONTINGENCY === */}
      <section className="rb-section">
        <h4 className="rb-section-title">Assignment Contingency</h4>
        <div className="rb-impact-grid">
          <div className="rb-impact-row">
            <span className="rb-impact-label">Originating put</span>
            <span className="rb-impact-val">{row.originatingPut.underlying} ${row.originatingPut.strike} Put {formatExp(row.originatingPut.expiration)}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Quantity</span>
            <span className="rb-impact-val">{Math.abs(row.originatingPut.quantity)} contract{Math.abs(row.originatingPut.quantity) !== 1 ? "s" : ""}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Shares if assigned</span>
            <span className="rb-impact-val">{row.contingentShares}</span>
          </div>
          <div className="rb-impact-row rb-impact-emphasis">
            <span className="rb-impact-label">Conditioned basis</span>
            <span className="rb-impact-val">${row.conditionedBasis.toFixed(2)}/share</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Basis provenance</span>
            <span className="rb-impact-val" style={{ fontSize: '9px', color: 'var(--wd-text-tertiary, #777)' }}>Put strike &mdash; original premium unavailable</span>
          </div>
        </div>
      </section>

      {/* === CALL OPPORTUNITY === */}
      <section className="rb-section">
        <h4 className="rb-section-title">Projected Call Opportunity</h4>
        <div className="rb-impact-grid">
          <div className="rb-impact-row">
            <span className="rb-impact-label">Strike</span>
            <span className="rb-impact-val">${row.strike}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Delta</span>
            <span className="rb-impact-val">{row.delta.toFixed(2)}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Bid</span>
            <span className="rb-impact-val">${row.bid.toFixed(2)}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Ask</span>
            <span className="rb-impact-val">${row.ask.toFixed(2)}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Mid</span>
            <span className="rb-impact-val">${row.mid.toFixed(2)}</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Spread</span>
            <span className={`rb-impact-val${row.spreadPercent > 15 ? " rb-warn" : ""}`}>{row.spreadPercent.toFixed(1)}%</span>
          </div>
          <div className="rb-impact-row">
            <span className="rb-impact-label">Open interest</span>
            <span className={`rb-impact-val${row.openInterest < 50 ? " rb-warn" : ""}`}>{row.openInterest.toLocaleString()}</span>
          </div>
          {row.yieldFromBasis != null && (
            <div className="rb-impact-row rb-impact-emphasis">
              <span className="rb-impact-label">Mid yield from basis</span>
              <span className="rb-impact-val">{row.yieldFromBasis.toFixed(1)}%</span>
            </div>
          )}
          <div className="rb-impact-row">
            <span className="rb-impact-label">Above basis by</span>
            <span className="rb-impact-val">+${row.opportunity.strikeDistanceFromBasis.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* === NOT EXECUTABLE === */}
      <section className="rb-section">
        <div className="rb-pcs-provenance" style={{ fontStyle: 'italic' }}>
          This call opportunity is contingent on assignment of the {row.originatingPut.underlying} ${row.originatingPut.strike} put expiring {formatExp(row.originatingPut.expiration)}.
          It is not executable until shares are owned.
        </div>
      </section>

      {/* === PROVENANCE === */}
      <section className="rb-section rb-provenance">
        <h4 className="rb-section-title">Evidence Provenance</h4>
        <div className="rb-prov-grid">
          <span>{cacheEnvironment.provider} &middot; {sessionClassification.canonicalSessionDate}</span>
          <span>{freshnessLabel}</span>
        </div>
      </section>
    </div>
  );
}

function formatExp(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
