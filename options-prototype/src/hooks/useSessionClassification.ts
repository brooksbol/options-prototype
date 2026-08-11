/**
 * useSessionClassification — wall-clock-driven market session state.
 *
 * Re-classifies the current market session on a fixed interval (default 30s).
 * Session state is a function of wall-clock time, not evidence arrival.
 *
 * This hook exists because session transitions (REGULAR → CLOSED_CANONICAL)
 * happen at fixed clock moments and must be reflected in the UI without
 * requiring a page reload or external event.
 */

import { useState, useEffect } from "react";
import { MarketSessionPolicy, type MarketSessionClassification } from "../market-session/session-policy";
import { getTradingCalendar } from "../market-session/trading-calendar";

const RECLASSIFY_INTERVAL_MS = 30_000; // 30 seconds

export function useSessionClassification(): MarketSessionClassification {
  const [classification, setClassification] = useState<MarketSessionClassification>(() => {
    const policy = new MarketSessionPolicy(getTradingCalendar());
    return policy.classify(new Date());
  });

  useEffect(() => {
    const policy = new MarketSessionPolicy(getTradingCalendar());

    const tick = () => {
      const next = policy.classify(new Date());
      setClassification(prev => {
        // Only update if state actually changed (avoids unnecessary re-renders)
        if (prev.state === next.state && prev.canonicalSessionDate === next.canonicalSessionDate) {
          return prev;
        }
        return next;
      });
    };

    const id = setInterval(tick, RECLASSIFY_INTERVAL_MS);
    // Immediately reclassify on mount (captures current time)
    tick();

    return () => clearInterval(id);
  }, []);

  return classification;
}
