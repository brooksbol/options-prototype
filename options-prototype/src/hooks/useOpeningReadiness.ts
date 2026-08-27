/**
 * useOpeningReadiness — polls /api/status for tier-level evidence readiness.
 *
 * Provides the operator-facing tier freshness data (governed A/B/C/D model):
 *   - Class A: X/Y eligible, Z due
 *   - Class B: X/Y eligible, Z due
 *   - Class C/D: lifecycle
 *   - Multi-DTE surface: X/Y current (weekly-capable 7-45 DTE decision surface)
 *
 * Polls at a configurable interval (default: 10s during active session).
 *
 * Note: the former opening-set experiment ("Opening N/N") presentation was
 * removed during the Aug 2026 market-open operational recovery — it was
 * experimental instrumentation, not an operator-approved readiness model.
 */

import { useEffect, useRef, useState, useCallback } from "react";

export interface TierReadiness {
  /**
   * Multi-DTE (weekly-capable) 7-45 DTE surface coverage.
   * Reports whether the full eligible decision surface is being held fresh,
   * so a collapsed Deployment board cannot masquerade as healthy.
   * (PL-COHERE-01 Finding #1 operational recovery.)
   */
  /**
   * DIAGNOSTIC ONLY — not an operator health target or SLO. 64 is the wrong denominator
   * (only trade-relevant symbols earn a tight surface obligation), so this stays low by
   * design. Exposed for architecture/troubleshooting; intentionally NOT rendered in the
   * primary operator header. See the Aug 2026 recovery.
   */
  multiDteSurface: {
    total: number;
    current: number;
    degraded: number;
  } | null;

  /**
   * Monitored-position (open-position) coverage (PL-EVID-01).
   * Are the operator's held positions current enough to monitor?
   */
  monitoredPositions: {
    total: number;
    current: number;
    degraded: number;
  } | null;

  /**
   * Decision Coverage — completeness of the candidate-generation opportunity space.
   * eligibleSymbols = symbols that could contribute a candidate; currentSymbols = those
   * with evidence fresh enough to participate NOW; staleSymbols = invisible to candidate
   * generation right now. When staleSymbols is material, the Deployment board is NOT
   * "best available across the eligible universe" — it reflects only the current subset.
   */
  decisionCoverage: {
    eligibleSymbols: number;
    currentSymbols: number;
    staleSymbols: number;
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
      const mdte = data.multiDteSurface;
      const mon = data.monitoredPositions;
      const cov = data.decisionCoverage;

      setReadiness({
        multiDteSurface: mdte && mdte.total > 0 ? {
          total: mdte.total,
          current: mdte.current,
          degraded: mdte.degraded,
        } : null,
        monitoredPositions: mon && mon.total > 0 ? {
          total: mon.total,
          current: mon.current,
          degraded: mon.degraded,
        } : null,
        decisionCoverage: cov && cov.eligibleSymbols > 0 ? {
          eligibleSymbols: cov.eligibleSymbols,
          currentSymbols: cov.currentSymbols,
          staleSymbols: cov.staleSymbols,
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
