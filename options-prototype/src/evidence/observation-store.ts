/**
 * Application-Scoped Observation Store
 *
 * Consumes GET /api/evidence/quotes?symbol=... and holds the current
 * Evidence observations for the active Portfolio underlying set.
 *
 * Represents Evidence observations, not Console state.
 * Does not know about positions, contracts, or Portfolio semantics.
 *
 * Lifecycle:
 * - Polling is active when: subscribers > 0 AND symbols.length > 0
 * - Polling stops when: subscribers === 0
 * - Symbol set changes invalidate ETag and trigger immediate re-poll
 * - Network errors preserve the last successful observation set
 * - Stale in-flight responses (from old symbol set) are discarded via AbortController
 *
 * Assumption for this increment:
 *   The application Observation Store observes the active Portfolio underlying set.
 *   A single canonical symbol set; "last caller wins" via setSymbols().
 */

// --- Types ---

export type AcquisitionStatus =
  | "ready"
  | "failed"
  | "pending"
  | "absent"
  | "expirations_known";

export interface QuoteObservation {
  symbol: string;
  /** Underlying price from last successful chain acquisition. null if never acquired. */
  price: number | null;
  /** When the price was observed (ISO timestamp). null if never acquired. */
  observedAt: string | null;
  /** Current acquisition machinery state */
  acquisitionStatus: AcquisitionStatus;
  /** Most recent acquisition attempt timestamp */
  lastAttemptAt: string | null;
  /** Consecutive failures since last success */
  failureCount: number;
}

export interface ObservationState {
  /** Evidence generation that produced the current observation set */
  generation: number | null;
  /** When this generation was published (ISO timestamp) */
  generatedAt: string | null;
  /** Per-symbol observations keyed by uppercase symbol */
  observations: ReadonlyMap<string, QuoteObservation>;
  /** Whether a poll is currently in-flight */
  polling: boolean;
  /** Result of the most recent poll attempt */
  lastPollResult: "200" | "304" | "error" | null;
}

// --- Constants ---

const POLL_INTERVAL_MS = 30_000;

// --- Module State ---

type Listener = () => void;
const listeners = new Set<Listener>();

let currentSymbols: string[] = [];
let currentSymbolKey = ""; // sorted joined string for comparison
let currentETag: string | null = null;
let currentAbortController: AbortController | null = null;
let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let isPolling = false;

// Stable cached state object — only replaced when data changes
let currentState: ObservationState = {
  generation: null,
  generatedAt: null,
  observations: new Map(),
  polling: false,
  lastPollResult: null,
};

// --- Notify ---

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Replace state with a new object (triggers re-render via useSyncExternalStore). */
function setState(patch: Partial<ObservationState>): void {
  currentState = { ...currentState, ...patch };
  notify();
}

// --- Public API ---

/**
 * Subscribe to observation state changes.
 * Returns an unsubscribe function.
 * Polling begins when first subscriber joins (with non-empty symbols).
 * Polling stops when last subscriber departs.
 */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  maybeStartPolling();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stopPolling();
    }
  };
}

/**
 * Read current observation state (for useSyncExternalStore).
 * Returns a stable reference until state actually changes.
 */
export function getObservations(): ObservationState {
  return currentState;
}

/**
 * Set the symbols to observe.
 * Idempotent: no-op if the normalized set is unchanged.
 * If changed: clears ETag, aborts in-flight request, polls immediately.
 */
export function setSymbols(symbols: string[]): void {
  const normalized = [...new Set(symbols.map(s => s.toUpperCase()))].sort();
  const key = normalized.join(",");

  if (key === currentSymbolKey) return; // No change

  currentSymbols = normalized;
  currentSymbolKey = key;
  currentETag = null; // Invalidate — new symbol set needs fresh data

  // Abort any in-flight request for the old symbol set
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    isPolling = false; // Allow immediate re-poll after abort
  }

  // If we have subscribers, poll immediately with new symbols and ensure interval is running
  if (listeners.size > 0 && normalized.length > 0) {
    poll();
    maybeStartPolling();
  }
}

// --- Polling Lifecycle ---

function maybeStartPolling(): void {
  if (pollIntervalId !== null) return; // Already polling
  if (listeners.size === 0) return;
  if (currentSymbols.length === 0) return;

  // Immediate first poll (skipped if one is already in-flight from setSymbols)
  if (!isPolling) {
    poll();
  }

  // Start interval
  pollIntervalId = setInterval(() => {
    if (listeners.size > 0 && currentSymbols.length > 0) {
      poll();
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling(): void {
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
  // Note: we do NOT abort in-flight requests here.
  // The in-flight request will complete harmlessly and update state.
  // Abort is reserved for symbol-set changes (in setSymbols) where the
  // response would be stale. Unsubscribe merely stops the interval —
  // it should not kill a request that is milliseconds from delivering data.
}

// --- Poll Execution ---

async function poll(): Promise<void> {
  if (isPolling) return; // No overlapping requests
  if (currentSymbols.length === 0) return;

  isPolling = true;
  setState({ polling: true });

  // Capture the symbol key at request start for staleness detection
  const requestSymbolKey = currentSymbolKey;
  const controller = new AbortController();
  currentAbortController = controller;

  try {
    const params = currentSymbols.map(s => `symbol=${encodeURIComponent(s)}`).join("&");
    const url = `/api/evidence/quotes?${params}`;

    const headers: Record<string, string> = {};
    if (currentETag) {
      headers["If-None-Match"] = currentETag;
    }

    const res = await fetch(url, { headers, signal: controller.signal });

    // Discard if symbol set changed while in-flight
    if (requestSymbolKey !== currentSymbolKey) {
      return;
    }

    if (res.status === 304) {
      setState({ polling: false, lastPollResult: "304" });
      return;
    }

    if (res.ok) {
      const etag = res.headers.get("etag");
      if (etag) currentETag = etag;

      const data = await res.json();

      // Discard if symbol set changed during JSON parsing
      if (requestSymbolKey !== currentSymbolKey) return;

      // Build new observations map
      const observations = new Map<string, QuoteObservation>();
      for (const q of data.quotes) {
        observations.set(q.symbol, {
          symbol: q.symbol,
          price: q.observation?.price ?? null,
          observedAt: q.observation?.observedAt ?? null,
          acquisitionStatus: q.acquisition.status as AcquisitionStatus,
          lastAttemptAt: q.acquisition.lastAttemptAt ?? null,
          failureCount: q.acquisition.failureCount ?? 0,
        });
      }

      setState({
        generation: data.generation,
        generatedAt: data.generatedAt,
        observations,
        polling: false,
        lastPollResult: "200",
      });
    } else {
      // HTTP error — preserve existing observations
      setState({ polling: false, lastPollResult: "error" });
    }
  } catch (err: unknown) {
    // Network error or abort — preserve existing observations
    if (err instanceof DOMException && err.name === "AbortError") {
      // Intentional abort (symbol set changed) — don't update lastPollResult
      return;
    }
    // Discard if symbol set changed
    if (requestSymbolKey !== currentSymbolKey) return;
    setState({ polling: false, lastPollResult: "error" });
  } finally {
    isPolling = false;
    if (currentAbortController === controller) {
      currentAbortController = null;
    }
  }
}

// --- Testing Support ---

/**
 * Reset store to initial state. Test-only.
 */
export function _resetForTesting(): void {
  stopPolling();
  // For tests, also abort any in-flight request to ensure clean state
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
  listeners.clear();
  currentSymbols = [];
  currentSymbolKey = "";
  currentETag = null;
  isPolling = false;
  currentState = {
    generation: null,
    generatedAt: null,
    observations: new Map(),
    polling: false,
    lastPollResult: null,
  };
}
