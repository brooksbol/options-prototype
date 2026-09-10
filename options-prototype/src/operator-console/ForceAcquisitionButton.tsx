/**
 * ForceAcquisitionButton — operator-forced one-shot evidence acquisition (PL-OPS-08).
 *
 * The bounded outage/forgotten-restart recovery control. Clicking it asks the backend to run
 * ONE full acquisition cycle immediately over the currently relevant universe, through the
 * existing provider/cache/persistence paths, bypassing the scheduler's due-time and
 * market-session gating for that single operator-requested cycle. It does not change the
 * scheduler, reopen continuous observation, or reconstruct a prior gap.
 *
 * Unlike the earlier "reevaluate" control (which delegated to worker.nudge() and was a
 * deterministic no-op once the session gate closed), this actually forces acquisition and
 * reports the honest disposition of what happened:
 *   - ACQUIRED with N symbols → "Acquired N" / "Acquired (up to date)" when nothing was due
 *   - PROVIDER_UNAVAILABLE    → "Provider unavailable"
 *   - NOT_RUNNING             → "Appliance offline"
 *   - transport failure       → "Acquisition failed"
 *
 * It never claims to have recovered missed history — that remains deferred PL-OPS-08 work.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { forceEvidenceAcquisition, type ForceAcquisitionResult } from "../evidence/nudge-acquisition";
import { refreshNow } from "../evidence/observation-store";

type Phase = "idle" | "acquiring" | "done";

const RESULT_LINGER_MS = 6000;

const IDLE_LABEL = "Refresh evidence now";
const BUSY_LABEL = "Acquiring…";

function resultLabel(result: ForceAcquisitionResult): string {
  if (!result.ok) return "Acquisition failed";
  switch (result.outcome) {
    case "ACQUIRED":
      return result.symbolsAcquired > 0
        ? `Acquired ${result.symbolsAcquired}`
        : "Acquired (up to date)";
    case "PROVIDER_UNAVAILABLE":
      return "Provider unavailable";
    case "NOT_RUNNING":
      return "Appliance offline";
    case "INTERRUPTED":
      return "Acquiring… (still running)";
    default:
      return "Done";
  }
}

export function ForceAcquisitionButton({ className = "oc-group-by-action", symbols }: { className?: string; symbols?: string[] }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState<string>(IDLE_LABEL);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const onClick = useCallback(async () => {
    if (phase === "acquiring") return;
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    setPhase("acquiring");
    setLabel(BUSY_LABEL);

    // Scope the refresh to the on-screen (portfolio) symbols when provided, so their
    // freshness reflects a just-now observation. With no symbols this stays a whole-cycle force.
    const result = await forceEvidenceAcquisition(symbols);

    // The backend acquisition cycle updates durable evidence, but the console reads
    // observations from the polling store (30s cadence). Force an immediate re-poll so
    // derived freshness reflects the just-acquired evidence rather than lagging a full
    // interval. Only meaningful when the cycle actually acquired — other dispositions
    // (offline, provider unavailable) leave evidence unchanged by design.
    if (result.ok && result.outcome === "ACQUIRED") {
      refreshNow();
    }

    setPhase("done");
    setLabel(resultLabel(result));
    resetTimer.current = setTimeout(() => {
      setPhase("idle");
      setLabel(IDLE_LABEL);
    }, RESULT_LINGER_MS);
  }, [phase, symbols]);

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={phase === "acquiring"}
      aria-busy={phase === "acquiring"}
      title="Re-observe the positions on screen now, bypassing due-time and market-session gating. Evidence keeps its real timestamps and provenance. Falls back to a full recovery cycle when no positions are shown."
    >
      {label}
    </button>
  );
}
