/**
 * Evidence Provenance — Tracks the temporal and session context of cached market evidence.
 *
 * Every market-sensitive cache record carries provenance that answers:
 * - When was this retrieved?
 * - What market time does it effectively represent?
 * - Which trading session does it belong to?
 * - Was it accepted as canonical for that session?
 *
 * Canonical write gating:
 * - Only evidence whose effectiveObservedAt falls within the session [open, close]
 *   may be stored as canonical for that session.
 * - Post-session retrievals must not overwrite canonical regular-session records.
 * - Prior-session canonical evidence remains available for priority and comparison.
 *
 * Resource classification:
 * - Session-sensitive: quotes, option chains, Greeks, bid/ask, volume, OI
 * - Non-session-sensitive: expiration lists, product structure, universe membership
 *   (these may be acquired at any time without session gating)
 */

import { computeEffectiveObservedAt, isCanonicalEvidence, type MarketSessionState } from "./session-policy";
import type { MarketSessionPolicy } from "./session-policy";
import type { TradingCalendar } from "./trading-calendar";

// --- Evidence Provenance ---

export interface EvidenceProvenance {
  /** When the provider was called */
  retrievedAt: string;
  /** Effective market observation time (retrievedAt - delay, or provider-supplied) */
  effectiveObservedAt: string;
  /** The trading session date this evidence represents */
  evidenceSessionDate: string;
  /** Market session state at retrieval time */
  retrievalSessionState: MarketSessionState;
  /** Whether this was accepted as canonical for its session */
  isCanonical: boolean;
  /** Provider delay used for effectiveObservedAt computation (ms) */
  providerDelayMs: number;
  /** Profile ID that governed this classification */
  profileId: string;
}

// --- Resource Classification ---

export type ResourceSensitivity = "session_sensitive" | "non_session_sensitive";

/**
 * Classify whether a resource type requires session gating.
 *
 * Session-sensitive: quotes, chains (bid/ask/OI/volume/Greeks change with market)
 * Non-session-sensitive: expirations, metadata, universe (structural, don't change intra-session)
 */
export function classifyResourceSensitivity(dataType: string): ResourceSensitivity {
  switch (dataType) {
    case "quote":
    case "chain":
      return "session_sensitive";
    case "expirations":
    case "metadata":
    case "absence":
    case "error":
    default:
      return "non_session_sensitive";
  }
}

// --- Provenance Builder ---

/**
 * Build evidence provenance for a provider response.
 *
 * For session-sensitive resources, determines whether the evidence qualifies
 * as canonical for the current trading session.
 *
 * For non-session-sensitive resources, always marks as canonical (structural data
 * is valid regardless of market hours).
 */
export function buildEvidenceProvenance(
  retrievedAt: Date,
  providerObservedAt: Date | null,
  dataType: string,
  sessionPolicy: MarketSessionPolicy,
  calendar: TradingCalendar
): EvidenceProvenance {
  const providerDelayMs = sessionPolicy.delayMs;
  const classification = sessionPolicy.classify(retrievedAt);
  const sensitivity = classifyResourceSensitivity(dataType);

  const effectiveObserved = computeEffectiveObservedAt(retrievedAt, providerObservedAt, providerDelayMs);

  let isCanonicalResult: boolean;
  let evidenceSessionDate: string;

  if (sensitivity === "non_session_sensitive") {
    // Structural data: always canonical, session date is the canonical session
    isCanonicalResult = true;
    evidenceSessionDate = classification.canonicalSessionDate;
  } else {
    // Session-sensitive: must pass the canonical acceptance test
    if (!classification.acceptingCanonicalEvidence) {
      isCanonicalResult = false;
      evidenceSessionDate = classification.canonicalSessionDate;
    } else {
      const sessionDate = classification.canonicalSessionDate;
      const sessionOpen = calendar.sessionOpen(sessionDate);
      const sessionClose = calendar.sessionClose(sessionDate);
      isCanonicalResult = isCanonicalEvidence(effectiveObserved, sessionOpen, sessionClose);
      evidenceSessionDate = sessionDate;
    }
  }

  return {
    retrievedAt: retrievedAt.toISOString(),
    effectiveObservedAt: effectiveObserved.toISOString(),
    evidenceSessionDate,
    retrievalSessionState: classification.state,
    isCanonical: isCanonicalResult,
    providerDelayMs,
    profileId: sessionPolicy.sessionProfile.id,
  };
}

// --- Canonical Write Gate ---

/**
 * Determine whether a new evidence record should be written to the canonical store.
 *
 * Rules:
 * 1. Non-session-sensitive data: always writable
 * 2. Session-sensitive data with isCanonical=true: writable
 * 3. Session-sensitive data with isCanonical=false: NOT writable as canonical
 *    (may be stored separately as observational/after-hours if needed)
 * 4. An existing canonical record for the same session should only be overwritten
 *    by a LATER effectiveObservedAt within the same session (prefer most recent observation)
 */
export function shouldWriteCanonical(
  newProvenance: EvidenceProvenance,
  existingProvenance: EvidenceProvenance | null,
  dataType: string
): boolean {
  const sensitivity = classifyResourceSensitivity(dataType);

  // Non-session-sensitive: always writable
  if (sensitivity === "non_session_sensitive") return true;

  // Must be canonical to write
  if (!newProvenance.isCanonical) return false;

  // No existing record: write
  if (!existingProvenance) return true;

  // Existing is not canonical for this session: overwrite
  if (!existingProvenance.isCanonical) return true;
  if (existingProvenance.evidenceSessionDate !== newProvenance.evidenceSessionDate) return true;

  // Both canonical for same session: prefer later effectiveObservedAt
  return newProvenance.effectiveObservedAt >= existingProvenance.effectiveObservedAt;
}
