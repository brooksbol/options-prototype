/**
 * Position Detail Modal — Progressive Learning Surface
 *
 * Displays rich contract information when a treemap tile is clicked.
 * Three content layers:
 *   1. Observed facts (always visible)
 *   2. Concept explanations (on demand via ⓘ affordance)
 *   3. Wheelwright interpretation (within expanded concepts)
 *
 * Centered modal with dimmed Console backdrop. Sticky contract header.
 * Dismiss via backdrop click, Escape, or × button.
 *
 * Assignment Consequence section uses high-contrast operational styling:
 * primary numbers are bright and immediately legible, semantic color
 * signals appreciation (green) or erosion (red).
 */

import { useEffect, useCallback, useState } from "react";
import type { PositionDetail } from "../portfolio/position-detail";
import type { CallAssignmentConsequence, PutAssignmentConsequence } from "../portfolio/assignment-consequence";
import type { ConceptContext } from "../concepts/types";
import { getConcept } from "../concepts/index";
import { formatMoneynessDisplay, classifyMoneyness } from "../operator-console/moneyness-presentation";
import "./position-detail-modal.css";

interface Props {
  detail: PositionDetail;
  onClose: () => void;
}

export function PositionDetailModal({ detail, onClose }: Props) {
  const { position } = detail;

  // Escape key dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Backdrop click dismiss
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const mState = classifyMoneyness(position);
  const mDisplay = formatMoneynessDisplay(position);
  const typeLabel = position.type === "put" ? "PUT" : "CALL";

  return (
    <div className="pdm-backdrop" onClick={handleBackdropClick}>
      <div className="pdm-modal" role="dialog" aria-modal="true">
        {/* Sticky Header */}
        <header className="pdm-header">
          <span className="pdm-header-type">{typeLabel}</span>
          <span className="pdm-header-symbol">{position.underlying}</span>
          <span className="pdm-header-strike">${position.strike} strike</span>
          <span className="pdm-header-exp">{formatDate(position.expiration)}</span>
          <span className="pdm-header-dte">{position.dte} DTE</span>
          {position.quantity > 1 && <span className="pdm-header-qty">×{position.quantity}</span>}
          <button className="pdm-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="pdm-body">
          {/* Situational Summary */}
          <SituationalSummary detail={detail} mState={mState} />

          {/* Contract Measurements */}
          <MeasurementsSection detail={detail} mDisplay={mDisplay} />

          {/* Assignment Consequence (ADR-013 Dimension 3) */}
          <ConsequenceSection detail={detail} />

          {/* Evidence & Provenance */}
          <ProvenanceSection detail={detail} />
        </div>
      </div>
    </div>
  );
}

// --- Situational Summary ---

function SituationalSummary({ detail, mState }: { detail: PositionDetail; mState: string }) {
  const { position } = detail;
  let summary: string;

  if (position.moneyness == null) {
    summary = `This ${position.type} on ${position.underlying} at the $${position.strike} strike expires in ${position.dte} days. No current market observation is available to determine moneyness.`;
  } else if (mState === "otm") {
    const pct = Math.abs(position.moneyness * 100).toFixed(1);
    summary = `This ${position.type} is out of the money. The underlying ($${position.underlyingPrice?.toFixed(2)}) is ${pct}% away from the $${position.strike} strike. With ${position.dte} days remaining, assignment at expiration would require a ${position.type === "put" ? "decline" : "rise"} in ${position.underlying}.`;
  } else if (mState === "itm") {
    const pct = Math.abs(position.moneyness * 100).toFixed(1);
    summary = `This ${position.type} is in the money. The underlying ($${position.underlyingPrice?.toFixed(2)}) has crossed the $${position.strike} strike by ${pct}%. If the position remained in this state at expiration, assignment would be expected.`;
  } else {
    summary = `This ${position.type} is near the money. The underlying ($${position.underlyingPrice?.toFixed(2)}) is very close to the $${position.strike} strike. Small movements in ${position.underlying} over the remaining ${position.dte} days will determine whether it finishes in or out of the money.`;
  }

  return (
    <section className="pdm-section">
      <p className="pdm-summary">{summary}</p>
    </section>
  );
}

// --- Measurements ---

function MeasurementsSection({ detail, mDisplay }: { detail: PositionDetail; mDisplay: string | null }) {
  const { position } = detail;

  return (
    <section className="pdm-section">
      <h3 className="pdm-section-title">Contract Measurements</h3>
      <dl className="pdm-measurements">
        <MeasurementRow label="Moneyness" value={mDisplay ?? "—"} conceptId="moneyness" detail={detail} />
        <MeasurementRow
          label="Underlying"
          value={position.underlyingPrice != null ? `$${position.underlyingPrice.toFixed(2)}` : "—"}
        />
        <MeasurementRow
          label="Strike distance"
          value={detail.dollarDistanceFromStrike.value != null
            ? `$${detail.dollarDistanceFromStrike.value.toFixed(2)} ${position.moneyness != null && position.moneyness > 0 ? "through strike" : "from strike"}`
            : "—"}
        />
        <MeasurementRow label="DTE" value={`${position.dte} days`} conceptId="dte" detail={detail} />
        <MeasurementRow
          label="Capital"
          value={position.encumberedCapital != null ? `$${position.encumberedCapital.toLocaleString()}` : "—"}
        />
      </dl>
    </section>
  );
}

// --- Assignment Consequence (high-contrast) ---

function ConsequenceSection({ detail }: { detail: PositionDetail }) {
  const { consequence } = detail;

  return (
    <section className="pdm-section pdm-consequence">
      <h3 className="pdm-section-title">
        If Assigned
        <ConceptToggle conceptId="assignment" detail={detail} />
      </h3>

      {consequence.type === "call" ? (
        <CallConsequenceContent consequence={consequence} detail={detail} />
      ) : (
        <PutConsequenceContent consequence={consequence} detail={detail} />
      )}
    </section>
  );
}

function CallConsequenceContent({ consequence, detail }: { consequence: CallAssignmentConsequence; detail: PositionDetail }) {
  // Compute the hero total: appreciation/erosion + premium credit
  const appValue = consequence.totalAppreciationOrErosion.value;
  const premValue = consequence.premiumCredit.value;
  const hasTotal = appValue != null || premValue != null;
  const heroTotal = (appValue ?? 0) + (premValue ?? 0);

  // Three-state color semantic based on consequence STRUCTURE:
  // Green: capital component >= 0 and total positive (appreciation + premium)
  // Amber: capital component < 0 but premium offsets it (total >= 0)
  // Red: total < 0 (premium insufficient to offset erosion)
  let heroClass = "";
  if (hasTotal) {
    if (heroTotal < 0) {
      heroClass = "pdm-hero-negative";
    } else if (appValue != null && appValue < 0) {
      heroClass = "pdm-hero-amber";
    } else {
      heroClass = "pdm-hero-positive";
    }
  }

  return (
    <div className="pdm-consequence-grid">
      {/* Hero Total — the first thing the eye lands on */}
      {hasTotal && (
        <div className="pdm-cq-hero">
          <span className="pdm-cq-hero-label">Total if assigned</span>
          <span className={`pdm-cq-hero-value ${heroClass}`}>
            {heroTotal >= 0 ? "+" : ""}${Math.abs(heroTotal).toLocaleString()}
          </span>
        </div>
      )}

      {/* Decomposition — explains why */}
      <div className="pdm-cq-block">
        <span className="pdm-cq-block-label">Decomposition</span>
        {appValue != null && (
          <div className="pdm-cq-line">
            <span className="pdm-cq-fact-label">Capital {appValue >= 0 ? "appreciation" : "erosion"}</span>
            <span className={`pdm-cq-value ${appValue >= 0 ? "pdm-cq-positive" : "pdm-cq-negative"}`}>
              {appValue >= 0 ? "+" : "−"}${Math.abs(appValue).toLocaleString()}
            </span>
          </div>
        )}
        {premValue != null && (
          <div className="pdm-cq-line">
            <span className="pdm-cq-fact-label">Premium</span>
            <span className="pdm-cq-value pdm-cq-premium">+${premValue.toLocaleString()}</span>
          </div>
        )}
        {appValue == null && consequence.brokerShareBasis.value == null && (
          <span className="pdm-cq-detail">Share basis unavailable — appreciation/erosion indeterminate</span>
        )}
      </div>

      {/* Principal Movement — what changes */}
      <div className="pdm-cq-block">
        <span className="pdm-cq-block-label">Principal Movement</span>
        <div className="pdm-cq-line">
          <span className="pdm-cq-fact-label">{consequence.sharesRemoved} shares</span>
          <span className="pdm-cq-arrow">→</span>
          <span className="pdm-cq-value">${consequence.cashProceeds.toLocaleString()}</span>
        </div>
        <span className="pdm-cq-detail">
          at ${consequence.salePricePerShare.toFixed(2)}/share
          {consequence.brokerShareBasis.value != null && ` (basis $${consequence.brokerShareBasis.value.toFixed(2)})`}
        </span>
      </div>

      {/* Analytical: Effective Exit */}
      {consequence.effectiveExitPrice.value != null && (
        <div className="pdm-cq-block pdm-cq-analytical">
          <span className="pdm-cq-block-label">Analytical</span>
          <div className="pdm-cq-line">
            <span className="pdm-cq-fact-label">effective exit</span>
            <span className="pdm-cq-value-secondary">${consequence.effectiveExitPrice.value.toFixed(2)}/share</span>
          </div>
          <span className="pdm-cq-detail">strike + credit/share (Wheelwright derivation)</span>
        </div>
      )}

      {/* State Transformation */}
      <div className="pdm-cq-block pdm-cq-state">
        <span className="pdm-cq-block-label">State</span>
        <span className="pdm-cq-state-line">{consequence.sharesLeavingInventory} shares leave inventory</span>
        <span className="pdm-cq-state-line">Call encumbrance resolved ({consequence.callEncumbranceResolved} shares)</span>
        {consequence.resultingShares != null && (
          <span className="pdm-cq-state-line">Resulting: {consequence.resultingShares} shares of {detail.position.underlying}</span>
        )}
      </div>
    </div>
  );
}

function PutConsequenceContent({ consequence, detail }: { consequence: PutAssignmentConsequence; detail: PositionDetail }) {
  return (
    <div className="pdm-consequence-grid">
      {/* Hero: Effective Acquisition Basis */}
      {consequence.analyticalEffectiveBasis.value != null ? (
        <div className="pdm-cq-hero">
          <span className="pdm-cq-hero-label">Effective basis if assigned</span>
          <span className="pdm-cq-hero-value pdm-hero-neutral">
            ${consequence.analyticalEffectiveBasis.value.toFixed(2)}/share
          </span>
        </div>
      ) : (
        <div className="pdm-cq-hero">
          <span className="pdm-cq-hero-label">Acquisition price if assigned</span>
          <span className="pdm-cq-hero-value pdm-hero-neutral">
            ${consequence.acquisitionPricePerShare.toFixed(2)}/share
          </span>
        </div>
      )}

      {/* Decomposition — how effective basis is derived */}
      <div className="pdm-cq-block">
        <span className="pdm-cq-block-label">Decomposition</span>
        <div className="pdm-cq-line">
          <span className="pdm-cq-fact-label">Strike acquisition</span>
          <span className="pdm-cq-value">${consequence.acquisitionPricePerShare.toFixed(2)}/share</span>
        </div>
        {consequence.premiumCreditPerShare.value != null && (
          <div className="pdm-cq-line">
            <span className="pdm-cq-fact-label">Premium offset</span>
            <span className="pdm-cq-value pdm-cq-premium">−${consequence.premiumCreditPerShare.value.toFixed(2)}/share</span>
          </div>
        )}
        {consequence.premiumCreditPerShare.value == null && (
          <span className="pdm-cq-detail">Option basis unavailable — effective basis indeterminate</span>
        )}
      </div>

      {/* Principal Movement */}
      <div className="pdm-cq-block">
        <span className="pdm-cq-block-label">Principal Movement</span>
        <div className="pdm-cq-line">
          <span className="pdm-cq-value">${consequence.cashConsumed.toLocaleString()}</span>
          <span className="pdm-cq-arrow">→</span>
          <span className="pdm-cq-fact-label">{consequence.sharesAcquired} shares</span>
        </div>
        {consequence.premiumCredit.value != null && (
          <div className="pdm-cq-line">
            <span className="pdm-cq-fact-label">Premium received</span>
            <span className="pdm-cq-value pdm-cq-premium">+${consequence.premiumCredit.value.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* State Transformation */}
      <div className="pdm-cq-block pdm-cq-state">
        <span className="pdm-cq-block-label">State</span>
        <span className="pdm-cq-state-line">Put obligation resolved (${consequence.putObligationResolved.toLocaleString()} cash released)</span>
        <span className="pdm-cq-state-line">{consequence.sharesCreated} shares enter inventory</span>
        {consequence.resultingTotalShares != null && (
          <span className="pdm-cq-state-line">
            Resulting: {consequence.resultingTotalShares} shares of {detail.position.underlying}
            {consequence.existingSharesOfUnderlying != null && consequence.existingSharesOfUnderlying > 0
              ? ` (${consequence.existingSharesOfUnderlying} existing + ${consequence.sharesCreated})`
              : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Evidence / Provenance ---

function ProvenanceSection({ detail }: { detail: PositionDetail }) {
  const { position } = detail;

  return (
    <section className="pdm-section pdm-provenance">
      <h3 className="pdm-section-title">Evidence &amp; Provenance</h3>
      <dl className="pdm-measurements pdm-measurements-muted">
        {position.priceObservedAt && (
          <MeasurementRow label="Price observed" value={formatTimestamp(position.priceObservedAt)} />
        )}
        {position.acquisitionStatus && (
          <MeasurementRow label="Acquisition" value={position.acquisitionStatus} />
        )}
        {position.evidenceGeneration != null && (
          <MeasurementRow label="Generation" value={`${position.evidenceGeneration}`} />
        )}
        <MeasurementRow label="Capital basis" value={position.capitalValuationBasis} />
        {detail.missingFacts.length > 0 && (
          <MeasurementRow label="Missing" value={detail.missingFacts.join("; ")} />
        )}
      </dl>
    </section>
  );
}

// --- Measurement Row with optional concept toggle ---

function MeasurementRow({ label, value, conceptId, detail }: {
  label: string;
  value: string;
  conceptId?: string;
  detail?: PositionDetail;
}) {
  return (
    <div className="pdm-row">
      <dt className="pdm-row-label">{label}</dt>
      <dd className="pdm-row-value">
        {value}
        {conceptId && detail && <ConceptToggle conceptId={conceptId} detail={detail} />}
      </dd>
    </div>
  );
}

// --- Concept Toggle (inline expandable ⓘ) ---

function ConceptToggle({ conceptId, detail }: { conceptId: string; detail: PositionDetail }) {
  const [expanded, setExpanded] = useState(false);
  const concept = getConcept(conceptId);
  if (!concept) return null;

  const ctx: ConceptContext = {
    position: detail.position,
    detail,
    inventory: detail.inventory,
  };

  const specificText = concept.specific(ctx);

  return (
    <>
      <button
        className={`pdm-concept-toggle ${expanded ? "pdm-concept-toggle-open" : ""}`}
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-label={`Explain: ${concept.title}`}
        title={concept.title}
      >
        ⓘ
      </button>
      {expanded && (
        <div className="pdm-concept-panel">
          <div className="pdm-concept-title">{concept.title}</div>
          <p className="pdm-concept-generic">{concept.generic}</p>
          {specificText && <p className="pdm-concept-specific">{specificText}</p>}
          {concept.systemNote && (
            <details className="pdm-concept-system">
              <summary>How Wheelwright uses this</summary>
              <p>{concept.systemNote}</p>
            </details>
          )}
        </div>
      )}
    </>
  );
}

// --- Helpers ---

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
}
