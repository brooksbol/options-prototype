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
