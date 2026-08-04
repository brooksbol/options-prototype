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
 */

import { useEffect, useCallback, useState } from "react";
import type { PositionDetail } from "../portfolio/position-detail";
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

          {/* Position Economics */}
          <EconomicsSection detail={detail} />

          {/* If Assigned */}
          <AssignmentSection detail={detail} />

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

// --- Position Economics ---

function EconomicsSection({ detail }: { detail: PositionDetail }) {
  const econ = detail.economics;
  const hasPremium = econ.premiumPerContract.value != null;

  if (!hasPremium) {
    return (
      <section className="pdm-section">
        <h3 className="pdm-section-title">Position Economics</h3>
        <p className="pdm-unavailable">Premium and opening transaction data not yet available. This information would come from Activity History ingestion.</p>
      </section>
    );
  }

  const provTag = econ.premiumPerContract.provenance === "demo" ? " (demo)" : "";

  return (
    <section className="pdm-section">
      <h3 className="pdm-section-title">Position Economics{provTag}</h3>
      <dl className="pdm-measurements">
        <MeasurementRow
          label="Premium received"
          value={`$${econ.premiumPerContract.value!.toFixed(2)} /contract`}
          conceptId="premium"
          detail={detail}
        />
        <MeasurementRow
          label="Gross premium"
          value={`$${econ.grossPremium.value!.toFixed(0)}`}
        />
        {econ.fees.value != null && econ.fees.value > 0 && (
          <MeasurementRow label="Fees" value={`$${econ.fees.value.toFixed(2)}`} />
        )}
        <MeasurementRow label="Net premium" value={`$${econ.netPremium.value!.toFixed(0)}`} />
        {econ.premiumReturnOnCapital.value != null && (
          <MeasurementRow
            label="Return on capital"
            value={`${(econ.premiumReturnOnCapital.value * 100).toFixed(1)}%`}
          />
        )}
        {econ.openedAt.value && (
          <MeasurementRow label="Opened" value={econ.openedAt.value} />
        )}
      </dl>
    </section>
  );
}

// --- If Assigned ---

function AssignmentSection({ detail }: { detail: PositionDetail }) {
  const scenario = detail.assignmentScenario;

  return (
    <section className="pdm-section">
      <h3 className="pdm-section-title">
        If Assigned
        <ConceptToggle conceptId="assignment" detail={detail} />
      </h3>

      {scenario.type === "put" ? (
        <PutAssignmentContent scenario={scenario} detail={detail} />
      ) : (
        <CallAssignmentContent scenario={scenario} detail={detail} />
      )}
    </section>
  );
}

function PutAssignmentContent({ scenario, detail }: { scenario: PositionDetail["assignmentScenario"] & { type: "put" }; detail: PositionDetail }) {
  return (
    <dl className="pdm-measurements">
      <MeasurementRow label="Shares acquired" value={`${scenario.sharesAcquired} shares of ${detail.position.underlying}`} />
      <MeasurementRow label="Purchase price" value={`$${scenario.assignmentPrice.toFixed(2)} /share`} />
      <MeasurementRow label="Cash consumed" value={`$${scenario.grossCashConsumed.toLocaleString()}`} />
      {scenario.premiumReceived.value != null && (
        <MeasurementRow
          label="Premium offset"
          value={`$${scenario.premiumReceived.value.toFixed(0)}`}
        />
      )}
      {scenario.effectiveBasis.value != null && (
        <MeasurementRow
          label="Effective basis"
          value={`$${scenario.effectiveBasis.value.toFixed(2)} /share`}
          conceptId="cost-basis"
          detail={detail}
        />
      )}
      {scenario.resultingShares != null && (
        <MeasurementRow label="Resulting shares" value={`${scenario.resultingShares} (${scenario.existingShares ?? 0} existing + ${scenario.sharesAcquired})`} />
      )}
      {scenario.additionalCallLots != null && scenario.additionalCallLots > 0 && (
        <MeasurementRow label="New call lots" value={`+${scenario.additionalCallLots} (100-share lots for covered calls)`} />
      )}
    </dl>
  );
}

function CallAssignmentContent({ scenario, detail }: { scenario: PositionDetail["assignmentScenario"] & { type: "call" }; detail: PositionDetail }) {
  return (
    <dl className="pdm-measurements">
      <MeasurementRow label="Shares called away" value={`${scenario.sharesCalledAway} shares of ${detail.position.underlying}`} />
      <MeasurementRow label="Sale price" value={`$${scenario.salePrice.toFixed(2)} /share`} />
      <MeasurementRow label="Gross proceeds" value={`$${scenario.grossProceeds.toLocaleString()}`} />
      {scenario.premiumReceived.value != null && (
        <MeasurementRow label="Premium received" value={`$${scenario.premiumReceived.value.toFixed(0)}`} />
      )}
      {scenario.costBasisPerShare.value != null && (
        <MeasurementRow
          label="Cost basis"
          value={`$${scenario.costBasisPerShare.value.toFixed(2)} /share`}
          conceptId="cost-basis"
          detail={detail}
        />
      )}
      {scenario.shareGainLoss.value != null && (
        <MeasurementRow
          label="Share gain/loss"
          value={`${scenario.shareGainLoss.value >= 0 ? "+" : ""}$${scenario.shareGainLoss.value.toFixed(0)}`}
        />
      )}
      {scenario.callAwayClassification.value != null && (
        <MeasurementRow label="Classification" value={formatClassification(scenario.callAwayClassification.value)} />
      )}
      {scenario.remainingShares != null && (
        <MeasurementRow label="Remaining shares" value={`${scenario.remainingShares}`} />
      )}
      {scenario.remainingCallLots != null && (
        <MeasurementRow label="Remaining call capacity" value={`${scenario.remainingCallLots} lots`} />
      )}
    </dl>
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
    scenario: detail.assignmentScenario,
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

function formatClassification(c: "appreciation" | "near-basis" | "below-basis"): string {
  switch (c) {
    case "appreciation": return "Assignment with appreciation";
    case "near-basis": return "Assignment near cost basis";
    case "below-basis": return "Assignment below cost basis";
  }
}
