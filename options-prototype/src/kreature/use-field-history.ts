/**
 * useFieldHistory — fetches full-universe spot_history for The Field.
 *
 * Uses GET /api/evidence/history/all — a bulk endpoint that returns all
 * spot observations for all symbols in one response. No batching needed.
 */

import { useState, useRef, useCallback } from "react";
import type { UniverseHistory } from "./field-data";
import { deduplicateHistory } from "./field-data";

const EMPTY_HISTORY: UniverseHistory = new Map();

export interface FieldHistoryState {
  /** Deduplicated history for the full observed universe */
  history: UniverseHistory;
  /** Whether load is in progress */
  loading: boolean;
  /** Timestamp of last successful fetch */
  lastFetchedAt: string | null;
  /** Error message if fetch failed */
  error: string | null;
}

/**
 * Fetch full-universe spot history for The Field.
 * Returns state + a manual trigger function.
 */
export function useFieldHistory(): [FieldHistoryState, () => void] {
  const [state, setState] = useState<FieldHistoryState>({
    history: EMPTY_HISTORY,
    loading: false,
    lastFetchedAt: null,
    error: null,
  });

  const fetchingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (abortRef.current) abortRef.current.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const since = new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/evidence/history/all?since=${encodeURIComponent(since)}`, {
        signal: abort.signal,
      });

      if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);

      const data = await res.json();
      if (abort.signal.aborted) return;

      // Yield to UI thread before heavy dedup computation
      await new Promise(resolve => setTimeout(resolve, 0));
      if (abort.signal.aborted) return;

      const deduped = deduplicateHistory(data.histories || {});

      setState({
        history: deduped,
        loading: false,
        lastFetchedAt: new Date().toISOString(),
        error: null,
      });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  return [state, fetchAll];
}

/**
 * Load history for a specific past session date (for REPLAY mode).
 * Uses a 14-hour window starting from ~09:00 ET on the given date.
 */
export async function loadSessionHistory(
  sessionDate: string,
  signal?: AbortSignal
): Promise<UniverseHistory> {
  // Session window: from 09:00 ET (13:00 UTC during EDT) to end of day
  // Use a generous window to capture the full trading session
  const since = `${sessionDate}T13:00:00.000Z`;

  const res = await fetch(`/api/evidence/history/all?since=${encodeURIComponent(since)}`, { signal });
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);

  const data = await res.json();

  if (!data.histories || Object.keys(data.histories).length === 0) {
    return new Map();
  }

  // Yield before dedup
  await new Promise(resolve => setTimeout(resolve, 0));

  return deduplicateHistory(data.histories);
}
