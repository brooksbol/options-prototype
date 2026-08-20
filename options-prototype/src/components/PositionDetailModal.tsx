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
  const typeLabel = position.type === "put" ? "PUT" : position.type === "buy-write" ? "BUY-WRITE" : "COVERED CALL";

  return (
    <div className="pdm-backdrop" onClick={handleBackdropClick}>
      <div className="pdm-modal" role="dialog" aria-modal="true">
        {/* === IMPATIENT MODE: Identity + Consequence === */}
        <header className="pdm-header">
          <div className="pdm-identity">
            <span className="pdm-header-type">{typeLabel}</span>
            <span className="pdm-header-symbol">{position.underlying}</span>
            {detail.instrumentDescription && (
              <span className="pdm-header-description">{detail.instrumentDescription}</span>
            )}
          </div>
          <div className="pdm-contract">
            <span className="pdm-header-strike">${position.strike}</span>
            <span className="pdm-header-exp">{formatDate(position.expiration)}</span>
            <span className="pdm-header-dte">{position.dte}d</span>
            {position.quantity > 1 && <span className="pdm-header-qty">×{position.quantity}</span>}
          </div>
          <button className="pdm-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        {/* Immediate Economic Consequence — the answer */}
        <ImmediateConsequence detail={detail} />

        {/* === REFLECTIVE MODE: Detail underneath === */}
        <div className="pdm-body">
          {/* Full Assignment Consequence Decomposition */}
          <ConsequenceSection detail={detail} />

          {/* Contract Measurements — collapsed by default */}
          <details className="pdm-disclosure">
            <summary className="pdm-disclosure-summary">Contract Measurements</summary>
            <MeasurementsContent detail={detail} mDisplay={mDisplay} />
          </details>

          {/* Evidence & Provenance — collapsed by default */}
          <details className="pdm-disclosure">
            <summary className="pdm-disclosure-summary">Evidence &amp; Provenance</summary>
            <ProvenanceContent detail={detail} />
          </details>
        </div>
      </div>
    </div>
  );
}

// --- Immediate Consequence (impatient mode) ---

function ImmediateConsequence({ detail }: { detail: PositionDetail }) {
  const { position, consequence, strikeToMarketConsequence } = detail;

  // PUT: strike-to-market capital loss
  if (position.type === "put") {
    if (!strikeToMarketConsequence || strikeToMarketConsequence.capitalLoss.value == null) {
      return (
        <div className="pdm-impatient">
          <span className="pdm-impatient-label">If assigned now</span>
          <span className="pdm-impatient-unavailable">Market price unavailable</span>
        </div>
      );
    }

    const loss = strikeToMarketConsequence.capitalLoss.value;
    const atPrice = strikeToMarketConsequence.atPrice;

    if (loss === 0) {
      return (
        <div className="pdm-impatient pdm-impatient-safe">
          <span className="pdm-impatient-label">If assigned now</span>
          <span className="pdm-impatient-value">No capital loss</span>
          <span className="pdm-impatient-context">
            Underlying ${atPrice?.toFixed(2)} above ${position.strike} strike
          </span>
        </div>
      );
    }

    return (
      <div className="pdm-impatient pdm-impatient-danger">
        <span className="pdm-impatient-label">If assigned now</span>
        <span className="pdm-impatient-value">Capital loss ${loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="pdm-impatient-context">
          at ${atPrice?.toFixed(2)} · ${position.quantity * 100} shares · ${position.strike} strike
        </span>
      </div>
    );
  }

  // CALL / BUY-WRITE: appreciation/erosion from assignment
  if (consequence.type === "call") {
    const appValue = consequence.totalAppreciationOrErosion.value;

    if (appValue == null) {
      return (
        <div className="pdm-impatient">
          <span className="pdm-impatient-label">If called away</span>
          <span className="pdm-impatient-unavailable">Share cost basis unavailable</span>
        </div>
      );
    }

    if (appValue >= 0) {
      return (
        <div className="pdm-impatient pdm-impatient-safe">
          <span className="pdm-impatient-label">If called away</span>
          <span className="pdm-impatient-value">Appreciation +${appValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          <span className="pdm-impatient-context">
            ${consequence.salePricePerShare} strike vs ${consequence.brokerShareBasis.value?.toFixed(2)} basis · {consequence.sharesRemoved} shares
          </span>
        </div>
      );
    }

    return (
      <div className="pdm-impatient pdm-impatient-danger">
        <span className="pdm-impatient-label">If called away</span>
        <span className="pdm-impatient-value">Capital erosion ${Math.abs(appValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className="pdm-impatient-context">
          ${consequence.salePricePerShare} strike vs ${consequence.brokerShareBasis.value?.toFixed(2)} basis · {consequence.sharesRemoved} shares
        </span>
      </div>
    );
  }

  return null;
}

// --- Situational Summary ---

function SituationalSummary({ detail, mState }: { detail: PositionDetail; mState: string }) {
  const { position } = detail;
  // Human-readable strategy name for prose
  const strategyName = position.type === "put" ? "put" : position.type === "buy-write" ? "buy-write" : "covered call";
  let summary: string;

  if (position.moneyness == null) {
    summary = `This ${strategyName} on ${position.underlying} at the $${position.strike} strike expires in ${position.dte} days. No current market observation is available to determine moneyness.`;
  } else if (mState === "otm") {
    const pct = Math.abs(position.moneyness * 100).toFixed(1);
    summary = `This ${strategyName} is out of the money. The underlying ($${position.underlyingPrice?.toFixed(2)}) is ${pct}% away from the $${position.strike} strike. With ${position.dte} days remaining, assignment at expiration would require a ${position.type === "put" ? "decline" : "rise"} in ${position.underlying}.`;
  } else if (mState === "itm") {
    const pct = Math.abs(position.moneyness * 100).toFixed(1);
    summary = `This ${strategyName} is in the money. The underlying ($${position.underlyingPrice?.toFixed(2)}) has crossed the $${position.strike} strike by ${pct}%. If the position remained in this state at expiration, assignment would be expected.`;
  } else {
    summary = `This ${strategyName} is near the money. The underlying ($${position.underlyingPrice?.toFixed(2)}) is very close to the $${position.strike} strike. Small movements in ${position.underlying} over the remaining ${position.dte} days will determine whether it finishes in or out of the money.`;
  }

  return (
    <section className="pdm-section">
      <p className="pdm-summary">{summary}</p>
    </section>
  );
}

// --- Measurements (content for disclosure) ---

function MeasurementsContent({ detail, mDisplay }: { detail: PositionDetail; mDisplay: string | null }) {
  const { position } = detail;

  return (
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
    <div className="pdm-cq-dense">
      {/* Hero: Total if assigned */}
      {hasTotal && (
        <div className="pdm-cq-hero-compact">
          <span className="pdm-cq-hero-label">Total if assigned</span>
          <span className={`pdm-cq-hero-value ${heroClass}`}>
            {heroTotal >= 0 ? "+" : ""}${Math.abs(heroTotal).toLocaleString()}
          </span>
          {/* Effective exit — inline secondary */}
          {consequence.effectiveExitPrice.value != null && (
            <span className="pdm-cq-inline-secondary">
              Effective exit ${consequence.effectiveExitPrice.value.toFixed(2)}/share
            </span>
          )}
        </div>
      )}

      {/* Reflective rows — inline, no cards */}
      <div className="pdm-cq-rows">
        {/* Decomposition as inline formula */}
        <div className="pdm-cq-row">
          <span className="pdm-cq-row-label">Decomposition</span>
          <span className="pdm-cq-row-content">
            {appValue != null && (
              <>
                <span className={appValue >= 0 ? "pdm-cq-positive" : "pdm-cq-negative"}>
                  {appValue >= 0 ? "+" : "−"}${Math.abs(appValue).toLocaleString()} {appValue >= 0 ? "appreciation" : "erosion"}
                </span>
                {premValue != null && " · "}
              </>
            )}
            {premValue != null && (
              <span className="pdm-cq-premium">+${premValue.toLocaleString()} premium</span>
            )}
            {appValue == null && consequence.brokerShareBasis.value == null && (
              <span className="pdm-cq-muted">Share basis unavailable — appreciation indeterminate</span>
            )}
          </span>
        </div>

        {/* Principal movement as one line */}
        <div className="pdm-cq-row">
          <span className="pdm-cq-row-label">Principal</span>
          <span className="pdm-cq-row-content">
            {consequence.sharesRemoved} shares → ${consequence.cashProceeds.toLocaleString()} at ${consequence.salePricePerShare.toFixed(2)}/share
            {consequence.brokerShareBasis.value != null && (
              <span className="pdm-cq-muted"> · basis ${consequence.brokerShareBasis.value.toFixed(2)}</span>
            )}
          </span>
        </div>

        {/* State transformation as one line */}
        <div className="pdm-cq-row">
          <span className="pdm-cq-row-label">State</span>
          <span className="pdm-cq-row-content">
            {consequence.sharesLeavingInventory} shares leave · encumbrance resolved
            {consequence.resultingShares != null && (
              <> · {consequence.resultingShares} {detail.position.underlying} remaining</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function PutConsequenceContent({ consequence, detail }: { consequence: PutAssignmentConsequence; detail: PositionDetail }) {
  return (
    <div className="pdm-cq-dense">
      {/* Hero: Effective Acquisition Basis */}
      <div className="pdm-cq-hero-compact">
        <span className="pdm-cq-hero-label">Effective basis if assigned</span>
        <span className="pdm-cq-hero-value pdm-hero-neutral">
          {consequence.analyticalEffectiveBasis.value != null
            ? `$${consequence.analyticalEffectiveBasis.value.toFixed(2)}/share`
            : `$${consequence.acquisitionPricePerShare.toFixed(2)}/share`}
        </span>
        {/* Market vs effective basis — inline reconciliation */}
        {consequence.marketVsEffectiveBasis.value != null && detail.position.underlyingPrice != null && (
          <span className="pdm-cq-inline-reconciliation">
            <span className={consequence.marketVsEffectiveBasis.value >= 0 ? "pdm-cq-positive" : "pdm-cq-negative"}>
              {consequence.marketVsEffectiveBasis.value >= 0 ? "+" : "−"}${Math.abs(consequence.marketVsEffectiveBasis.value).toFixed(2)}/share vs market
            </span>
            <span className="pdm-cq-muted">
              {" · "}{consequence.marketVsEffectiveBasis.value >= 0 ? "+" : "−"}${Math.abs(consequence.marketVsEffectiveBasis.value * consequence.sharesAcquired).toFixed(0)} total
            </span>
          </span>
        )}
      </div>

      {/* Reflective rows — inline, no cards */}
      <div className="pdm-cq-rows">
        {/* Decomposition as inline formula */}
        {consequence.premiumCreditPerShare.value != null ? (
          <div className="pdm-cq-row">
            <span className="pdm-cq-row-label">Decomposition</span>
            <span className="pdm-cq-row-content">
              ${consequence.acquisitionPricePerShare.toFixed(2)} strike − ${consequence.premiumCreditPerShare.value.toFixed(2)} premium
            </span>
          </div>
        ) : (
          <div className="pdm-cq-row">
            <span className="pdm-cq-row-label">Decomposition</span>
            <span className="pdm-cq-row-content pdm-cq-muted">Premium unavailable — effective basis indeterminate</span>
          </div>
        )}

        {/* Principal movement as one line */}
        <div className="pdm-cq-row">
          <span className="pdm-cq-row-label">Principal</span>
          <span className="pdm-cq-row-content">
            ${consequence.cashConsumed.toLocaleString()} → {consequence.sharesAcquired} shares
            {consequence.premiumCredit.value != null && (
              <> · <span className="pdm-cq-premium">premium ${consequence.premiumCredit.value.toLocaleString()}</span></>
            )}
          </span>
        </div>

        {/* State transformation as one line */}
        <div className="pdm-cq-row">
          <span className="pdm-cq-row-label">State</span>
          <span className="pdm-cq-row-content">
            Put resolved · {consequence.sharesCreated} {detail.position.underlying} shares enter
            {consequence.existingSharesOfUnderlying != null && consequence.existingSharesOfUnderlying > 0 && (
              <> · {consequence.resultingTotalShares} total</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

// --- Evidence / Provenance (content for disclosure) ---

function ProvenanceContent({ detail }: { detail: PositionDetail }) {
  const { position } = detail;

  return (
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
