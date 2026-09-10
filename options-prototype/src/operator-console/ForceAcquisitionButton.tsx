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

export function ForceAcquisitionButton({ className = "oc-group-by-action" }: { className?: string }) {
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

    const result = await forceEvidenceAcquisition();

    setPhase("done");
    setLabel(resultLabel(result));
    resetTimer.current = setTimeout(() => {
      setPhase("idle");
      setLabel(IDLE_LABEL);
    }, RESULT_LINGER_MS);
  }, [phase]);

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={phase === "acquiring"}
      aria-busy={phase === "acquiring"}
      title="Force one acquisition cycle now over the relevant universe, bypassing due-time and market-session gating (outage/forgotten-restart recovery). Evidence keeps its real timestamps and provenance. Does not reconstruct history missed during a prior outage."
    >
      {label}
    </button>
  );
}
