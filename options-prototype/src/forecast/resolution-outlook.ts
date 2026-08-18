/**
 * Resolution Outlook — V1 Classification Module
 *
 * Classifies monitored positions into directional resolution categories
 * for Operating Forecast (Production Outlook).
 *
 * Architecture: ADR-013 amendment (Resolution Outlook layer)
 * Policy: docs/27-resolution-outlook-v1.md
 *
 * This is a provisional operating experiment. The parameters (temporalWindow,
 * moneynessBuffer) are Principal-selected starting values, not derived truths.
 * They will be evaluated against actual outcomes and refined if needed.
 *
 * Pure function. No React, no side effects.
 *
 * Domain composition:
 *   MonitoredPosition (with DTE + moneyness) → Resolution Outlook classification
 *
 * Does NOT: compute economic consequences, produce probabilities, authorize
 * deployment, or claim calibrated accuracy.
 */

import type { MonitoredPosition } from "../portfolio/position-monitoring";

// --- V1 Policy Parameters (provisional) ---

/**
 * Temporal gate: only classify positions within this many DTE.
 * Positions further from expiration remain Uncertain.
 */
export const TEMPORAL_WINDOW_DTE = 5;

/**
 * Spatial gate: only classify positions whose |moneyness| exceeds this buffer.
 * Positions closer to the strike remain Uncertain.
 *
 * Expressed as a fraction (0.03 = 3%).
 */
export const MONEYNESS_BUFFER = 0.03;

// --- Types ---

export type ResolutionCategory =
  | "likely-expires-otm"
  | "likely-assigned"
  | "uncertain";

export interface ResolutionOutlook {
  /** Position identifier (matches MonitoredPosition.id) */
  positionId: string;
  /** The directional classification */
  category: ResolutionCategory;
  /** Evidence that produced this classification */
  evidence: ResolutionEvidence;
  /** Whether this position expires within the current month */
  expiresThisMonth: boolean;
}

export interface ResolutionEvidence {
  /** DTE at time of classification */
  dte: number;
  /** Moneyness at time of classification (null = no observation) */
  moneyness: number | null;
  /** Underlying price used (null = unavailable) */
  underlyingPrice: number | null;
  /** Strike price */
  strike: number;
  /** Timestamp of the classification (ISO) */
  classifiedAt: string;
  /** Why this category was assigned */
  reason: string;
}

// --- Classification ---

/**
 * Classify a single monitored position into a Resolution Outlook category.
 *
 * Policy (V1):
 *   - Position must expire within current month (expiresThisMonth = true)
 *   - DTE must be ≤ temporalWindow
 *   - |moneyness| must be > moneynessBuffer
 *   - If both gates pass: ITM → likely-assigned, OTM → likely-expires-otm
 *   - Otherwise: uncertain
 *
 * Null moneyness (missing evidence) always → uncertain.
 */
export function classifyPosition(
  position: MonitoredPosition,
  expiresThisMonth: boolean,
  now: Date = new Date(),
): ResolutionOutlook {
  const classifiedAt = now.toISOString();

  const baseEvidence: ResolutionEvidence = {
    dte: position.dte,
    moneyness: position.moneyness,
    underlyingPrice: position.underlyingPrice,
    strike: position.strike,
    classifiedAt,
    reason: "",
  };

  // Not expiring this month → not applicable, classify as uncertain
  if (!expiresThisMonth) {
    return {
      positionId: position.id,
      category: "uncertain",
      evidence: { ...baseEvidence, reason: "Expires beyond current month" },
      expiresThisMonth: false,
    };
  }

  // No price observation → cannot classify
  if (position.moneyness == null) {
    return {
      positionId: position.id,
      category: "uncertain",
      evidence: { ...baseEvidence, reason: "No price observation available" },
      expiresThisMonth: true,
    };
  }

  // Temporal gate: too far from expiration
  if (position.dte > TEMPORAL_WINDOW_DTE) {
    return {
      positionId: position.id,
      category: "uncertain",
      evidence: {
        ...baseEvidence,
        reason: `DTE ${position.dte} exceeds temporal window (${TEMPORAL_WINDOW_DTE})`,
      },
      expiresThisMonth: true,
    };
  }

  // Spatial gate: too close to strike
  const absMoneyness = Math.abs(position.moneyness);
  if (absMoneyness <= MONEYNESS_BUFFER) {
    return {
      positionId: position.id,
      category: "uncertain",
      evidence: {
        ...baseEvidence,
        reason: `|moneyness| ${(absMoneyness * 100).toFixed(1)}% within buffer (${MONEYNESS_BUFFER * 100}%)`,
      },
      expiresThisMonth: true,
    };
  }

  // Both gates pass — classify directionally
  if (position.moneyness > 0) {
    // Positive moneyness = ITM
    return {
      positionId: position.id,
      category: "likely-assigned",
      evidence: {
        ...baseEvidence,
        reason: `ITM by ${(position.moneyness * 100).toFixed(1)}% with ${position.dte} DTE`,
      },
      expiresThisMonth: true,
    };
  } else {
    // Negative moneyness = OTM
    return {
      positionId: position.id,
      category: "likely-expires-otm",
      evidence: {
        ...baseEvidence,
        reason: `OTM by ${(absMoneyness * 100).toFixed(1)}% with ${position.dte} DTE`,
      },
      expiresThisMonth: true,
    };
  }
}

// --- Batch Classification ---

/**
 * Classify all monitored positions, producing a ResolutionOutlook per position.
 *
 * @param positions All monitored positions from the portfolio
 * @param monthEnd Last day of the current month (used to determine expiresThisMonth)
 * @param now Override for testing
 */
export function classifyAllPositions(
  positions: MonitoredPosition[],
  monthEnd: Date,
  now: Date = new Date(),
): ResolutionOutlook[] {
  const monthEndMs = monthEnd.getTime();

  return positions.map((position) => {
    const expirationMs = new Date(position.expiration).getTime();
    const expiresThisMonth = expirationMs <= monthEndMs;
    return classifyPosition(position, expiresThisMonth, now);
  });
}
