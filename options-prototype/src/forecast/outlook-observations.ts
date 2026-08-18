/**
 * Outlook Observations — Classification History Persistence
 *
 * Records successive Resolution Outlook classifications for each position
 * so that future evaluation can determine whether the V1 policy was adequate.
 *
 * Architecture (docs/27-resolution-outlook-v1.md):
 *   "Record successive classifications... A position might go:
 *    Uncertain → Likely expires OTM → Uncertain → Likely assigned"
 *
 * Persisted in localStorage for the prototype phase. Bounded to prevent
 * unbounded growth. Organized by month for eventual comparison with
 * reconciled production outcomes.
 *
 * No React. No side effects beyond localStorage.
 */

import type { ResolutionOutlook, ResolutionCategory } from "./resolution-outlook";

// --- Types ---

export interface OutlookObservation {
  /** Position identifier */
  positionId: string;
  /** Underlying symbol (for human readability in stored data) */
  underlying: string;
  /** Classification at this observation */
  category: ResolutionCategory;
  /** DTE at observation time */
  dte: number;
  /** Moneyness at observation time (null = no evidence) */
  moneyness: number | null;
  /** Underlying price at observation time */
  underlyingPrice: number | null;
  /** When this observation was recorded */
  observedAt: string;
  /** Human-readable reason from the classification */
  reason: string;
}

export interface MonthlyObservationRecord {
  /** Month identifier (e.g., "2026-08") */
  month: string;
  /** All observations recorded during this month, ordered by time */
  observations: OutlookObservation[];
  /** When the first observation for this month was recorded */
  firstObserved: string;
  /** When the most recent observation was recorded */
  lastObserved: string;
}

// --- Storage ---

const STORAGE_KEY = "wheelwright:forecast:outlook-observations";
const MAX_MONTHS = 6; // Keep 6 months of history
const MAX_OBSERVATIONS_PER_MONTH = 500; // Safety bound

/**
 * Record a batch of Resolution Outlook classifications as observations.
 *
 * Called each time the forecast is recomputed (e.g., on evidence refresh).
 * Appends to the current month's observation record.
 */
export function recordOutlookObservations(
  outlooks: ResolutionOutlook[],
  positions: Map<string, { underlying: string }>,
  month: string,
  now: Date = new Date(),
): void {
  const observedAt = now.toISOString();

  const newObservations: OutlookObservation[] = outlooks
    .filter(o => o.expiresThisMonth) // Only record positions in forecast scope
    .map(o => ({
      positionId: o.positionId,
      underlying: positions.get(o.positionId)?.underlying ?? "unknown",
      category: o.category,
      dte: o.evidence.dte,
      moneyness: o.evidence.moneyness,
      underlyingPrice: o.evidence.underlyingPrice,
      observedAt,
      reason: o.evidence.reason,
    }));

  if (newObservations.length === 0) return;

  try {
    const records = loadAllRecords();

    // Find or create the current month's record
    let monthRecord = records.find(r => r.month === month);
    if (!monthRecord) {
      monthRecord = {
        month,
        observations: [],
        firstObserved: observedAt,
        lastObserved: observedAt,
      };
      records.push(monthRecord);
    }

    // Append observations (bounded)
    const remaining = MAX_OBSERVATIONS_PER_MONTH - monthRecord.observations.length;
    if (remaining > 0) {
      monthRecord.observations.push(...newObservations.slice(0, remaining));
    }
    monthRecord.lastObserved = observedAt;

    // Trim old months
    records.sort((a, b) => b.month.localeCompare(a.month)); // Most recent first
    const trimmed = records.slice(0, MAX_MONTHS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable or full — fail silently
  }
}

/**
 * Load all observation records (for inspection/debugging).
 */
export function loadAllRecords(): MonthlyObservationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as MonthlyObservationRecord[];
  } catch {
    return [];
  }
}

/**
 * Load observations for a specific month.
 */
export function loadMonthObservations(month: string): OutlookObservation[] {
  const records = loadAllRecords();
  const record = records.find(r => r.month === month);
  return record?.observations ?? [];
}

/**
 * Get the classification trajectory for a specific position within a month.
 * Returns observations in chronological order.
 */
export function getPositionTrajectory(positionId: string, month: string): OutlookObservation[] {
  const observations = loadMonthObservations(month);
  return observations
    .filter(o => o.positionId === positionId)
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}
