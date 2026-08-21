/**
 * Portfolio Capital History — Observation Persistence
 *
 * Persists Portfolio Capital observations as a longitudinal series in localStorage.
 * Each observation is a (timestamp, value) pair recorded when the operator imports
 * Fidelity CSV data. The series grows over time as the operator repeatedly imports.
 *
 * This is the first piece of infrastructure for the header trajectory chart.
 * It records truthful observations without interpolation or inference.
 *
 * Design decisions:
 *   - localStorage (operator-provided data, same authority model as portfolio CSV)
 *   - Deduplication by timestamp (re-importing the same CSV doesn't create duplicates)
 *   - Sorted chronologically
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

export type TimeRange = "all" | "1y" | "6m" | "3m" | "1m";

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
 * Record a new Portfolio Capital observation.
 *
 * Deduplicates by timestamp: if an observation with the same timestamp already
 * exists, it is replaced (the operator may have re-imported with corrected data).
 *
 * Returns the updated history.
 */
export function recordObservation(
  timestamp: string,
  value: number,
): PortfolioCapitalObservation[] {
  const history = loadHistory();

  // Deduplicate: replace any existing observation at the same timestamp
  const existingIndex = history.findIndex((o) => o.timestamp === timestamp);
  if (existingIndex >= 0) {
    history[existingIndex] = { timestamp, value };
  } else {
    history.push({ timestamp, value });
    history.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  localStorage.setItem(LS_KEY_HISTORY, JSON.stringify(history));
  return history;
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
  return value === "all" || value === "1y" || value === "6m" || value === "3m" || value === "1m";
}

// --- Test Support ---

/**
 * Clear all persisted history. Test-only.
 */
export function _clearHistoryForTesting(): void {
  localStorage.removeItem(LS_KEY_HISTORY);
  localStorage.removeItem(LS_KEY_TIME_RANGE);
}
