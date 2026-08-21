/**
 * useOpeningReadiness — polls /api/status for tier-level evidence readiness.
 *
 * Provides the operator-facing tier freshness data:
 *   - Opening set: X/Y current
 *   - Class A: X/Y eligible, Z due
 *   - Class B: X/Y eligible, Z due
 *   - Class C/D: lifecycle
 *
 * Polls at a configurable interval (default: 10s during active session).
 * This is experiment instrumentation. Not a permanent product surface.
 */

import { useEffect, useRef, useState, useCallback } from "react";

export interface TierReadiness {
  /** Opening-set experiment data (null if experiment not active) */
  opening: {
    setSize: number;
    currentCount: number;
    hydrationFraction: number;
    burstComplete: boolean;
    burstStartAt: string | null;
    hydration100At: string | null;
  } | null;

  /** Class-level eligible populations */
  eligible: {
    classA: number;
    classB: number;
    classC: number;
    classD: number;
  };

  /** Class-level due (currently needing refresh) populations */
  due: {
    classA: number;
    classB: number;
    classC: number;
    classD: number;
  };

  /** Scheduler state */
  schedulerState: string;
  sessionState: string;
}

const POLL_INTERVAL_MS = 10_000;

export function useOpeningReadiness(enabled: boolean): {
  readiness: TierReadiness | null;
  error: boolean;
} {
  const [readiness, setReadiness] = useState<TierReadiness | null>(null);
  const [error, setError] = useState(false);
  const pollingRef = useRef(false);

  const poll = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    try {
      const res = await fetch("/api/status");
      if (!res.ok) {
        setError(true);
        return;
      }

      const data = await res.json();
      const telemetry = data.schedulerTelemetry;
      const openingExp = data.openingExperiment;

      setReadiness({
        opening: openingExp && openingExp.setSize > 0 ? {
          setSize: openingExp.setSize,
          currentCount: openingExp.currentCount,
          hydrationFraction: openingExp.hydrationFraction,
          burstComplete: openingExp.burstComplete,
          burstStartAt: openingExp.burstStartAt ?? null,
          hydration100At: openingExp.hydration100At ?? null,
        } : null,
        eligible: telemetry?.eligible ?? { classA: 0, classB: 0, classC: 0, classD: 0 },
        due: telemetry?.due ?? { classA: 0, classB: 0, classC: 0, classD: 0 },
        schedulerState: data.scheduler?.state ?? "unknown",
        sessionState: telemetry?.sessionState ?? "unknown",
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      pollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, poll]);

  return { readiness, error };
}
