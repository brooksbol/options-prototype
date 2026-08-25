/**
 * Portfolio Capital History — Observation Persistence
 *
 * Persists Portfolio Capital observations as a longitudinal series in localStorage.
 * Each observation represents one day's Portfolio Capital reading, recorded when
 * the operator successfully imports Fidelity CSV data.
 *
 * Semantic model (August 2026):
 *   - One observation per operator-local calendar day.
 *   - The observation is created by a successful CSV import, not by application startup.
 *   - The observation identity is the LOCAL calendar day of import (not the Fidelity
 *     export timestamp). Fidelity export timestamps are provenance — they tell us
 *     when the underlying broker evidence was generated. The trajectory point represents
 *     "the operator took a reading on this calendar day."
 *   - Multiple imports on the same day update/replace that day's single observation.
 *   - Hydration (opening the app) does NOT create observations.
 *   - A dot on the trajectory chart means: "On this day, I imported and my Portfolio
 *     Capital was $X."
 *
 * Design decisions:
 *   - localStorage (operator-provided data, same authority model as portfolio CSV)
 *   - Deduplication by local calendar date (one point per day, most recent import wins)
 *   - Sorted chronologically
 *   - Timestamps stored as "YYYY-MM-DDT12:00:00" (local noon) for stable day identity
 *   - No maximum size limit initially (months of daily observations = small)
 *
 * See: docs/journal/project-journal.md — "Portfolio Capital Trajectory Discovery"
 */

// --- Types ---

export interface PortfolioCapitalObservation {
  /** ISO timestamp of the observation (from Fidelity export timestamp or import time) */
  timestamp: string;
  /** Portfolio Capital value at this observation */
  value: number;
}

export type TimeRange = "all" | "1y" | "6m" | "3m" | "1m" | "1w";

// --- localStorage Keys ---

const LS_KEY_HISTORY = "wheelwright:portfolio-capital:history";
const LS_KEY_TIME_RANGE = "wheelwright:portfolio-capital:time-range";

// --- History Management ---

/**
 * Load all persisted Portfolio Capital observations, sorted chronologically.
 */
export function loadHistory(): PortfolioCapitalObservation[] {
  try {
    const raw = localStorage.getItem(LS_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate shape and sort
    return parsed
      .filter(
        (o: unknown): o is PortfolioCapitalObservation =>
          typeof o === "object" &&
          o !== null &&
          typeof (o as Record<string, unknown>).timestamp === "string" &&
          typeof (o as Record<string, unknown>).value === "number",
      )
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } catch {
    return [];
  }
}

/**
 * Record a new Portfolio Capital observation for today's import.
 *
 * Deduplicates by LOCAL calendar date: one observation per day.
 * Multiple imports on the same day update/replace that day's point.
 * The timestamp stored represents the calendar day at local noon
 * (avoids UTC boundary issues shifting observations to adjacent dates).
 *
 * Returns the updated history.
 */
export function recordObservation(
  _sourceTimestamp: string,
  value: number,
  importDate: Date = new Date(),
): PortfolioCapitalObservation[] {
  const history = loadHistory();

  // Calendar day identity: local YYYY-MM-DD
  const dayKey = toLocalDateKey(importDate);
  // Store as local noon ISO — stable sort order, avoids UTC date-shift
  const dayTimestamp = dayKey + "T12:00:00";

  // Deduplicate: replace any existing observation for the same calendar day
  const existingIndex = history.findIndex((o) => toLocalDateKey(new Date(o.timestamp)) === dayKey);
  if (existingIndex >= 0) {
    history[existingIndex] = { timestamp: dayTimestamp, value };
  } else {
    history.push({ timestamp: dayTimestamp, value });
    history.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(history));
  return history;
}

/**
 * Extract local calendar date as YYYY-MM-DD string.
 * Uses the operator's local timezone, not UTC.
 */
function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Filter history to observations within the given time range, relative to now.
 */
export function filterByRange(
  history: PortfolioCapitalObservation[],
  range: TimeRange,
  now: Date = new Date(),
): PortfolioCapitalObservation[] {
  if (range === "all") return history;

  const cutoff = new Date(now);
  switch (range) {
    case "1y":
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
    case "6m":
      cutoff.setMonth(cutoff.getMonth() - 6);
      break;
    case "3m":
      cutoff.setMonth(cutoff.getMonth() - 3);
      break;
    case "1m":
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case "1w":
      cutoff.setDate(cutoff.getDate() - 7);
      break;
  }

  const cutoffIso = cutoff.toISOString();
  return history.filter((o) => o.timestamp >= cutoffIso);
}

// --- Time Range Preference ---

/**
 * Load the operator's last selected time range. Defaults to "all" if none persisted.
 */
export function loadTimeRange(): TimeRange {
  try {
    const raw = localStorage.getItem(LS_KEY_TIME_RANGE);
    if (raw && isValidTimeRange(raw)) return raw;
    return "all";
  } catch {
    return "all";
  }
}

/**
 * Persist the operator's selected time range.
 */
export function saveTimeRange(range: TimeRange): void {
  localStorage.setItem(LS_KEY_TIME_RANGE, range);
}

function isValidTimeRange(value: string): value is TimeRange {
  return value === "all" || value === "1y" || value === "6m" || value === "3m" || value === "1m" || value === "1w";
}

// --- Test Support ---

/**
 * Clear all persisted history. Test-only.
 */
export function _clearHistoryForTesting(): void {
  localStorage.removeItem(LS_KEY_HISTORY);
  localStorage.removeItem(LS_KEY_TIME_RANGE);
}

// --- Historical Seed (one-time bootstrap from prior Fidelity CSVs) ---

/**
 * Seeds trajectory history from prior Fidelity CSV exports if no history exists.
 * This runs once — after seeding, the regular observation recording takes over.
 * Data was extracted from ~/Downloads Balances + Option Summary file pairs.
 *
 * Remove this function after the trajectory has been operating for a while
 * and the seeded data is no longer the only history.
 */
function seedHistoryIfEmpty(): void {
  const existing = localStorage.getItem(LS_KEY_HISTORY);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 1) return; // already has meaningful history
    } catch { /* corrupt — re-seed */ }
  }

  const seed: PortfolioCapitalObservation[] = [
    { timestamp: "2026-07-10T17:48:11.427Z", value: 120074.93 },
    { timestamp: "2026-07-14T15:12:48.508Z", value: 121484.38 },
    { timestamp: "2026-07-15T14:40:13.570Z", value: 122543.90 },
    { timestamp: "2026-07-16T01:41:49.064Z", value: 122616.95 },
    { timestamp: "2026-07-21T15:13:23.964Z", value: 123841.92 },
    { timestamp: "2026-07-27T04:05:16.791Z", value: 126060.39 },
    { timestamp: "2026-07-29T14:57:57.018Z", value: 122992.36 },
    { timestamp: "2026-08-03T15:43:30.534Z", value: 123015.99 },
    { timestamp: "2026-08-10T04:29:36.655Z", value: 122491.94 },
    { timestamp: "2026-08-11T13:32:00.550Z", value: 118459.14 },
    { timestamp: "2026-08-12T19:55:23.553Z", value: 118776.33 },
    { timestamp: "2026-08-13T19:54:24.465Z", value: 118919.59 },
    { timestamp: "2026-08-17T14:52:49.348Z", value: 120666.91 },
    { timestamp: "2026-08-18T19:21:27.707Z", value: 118960.23 },
    { timestamp: "2026-08-20T18:06:39.776Z", value: 120855.24 },
    { timestamp: "2026-08-21T18:02:39.765Z", value: 121340.47 },
  ];

  localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(seed));
}

// Run seed check on module load
seedHistoryIfEmpty();
