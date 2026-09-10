/**
 * CrossEntryRefreshButton — "Refresh top opportunities" for Cash Deployment (PL-OPS-09 consumer).
 *
 * The Operator Console's ForceAcquisitionButton is the usability benchmark: click refresh →
 * authoritative evidence updates → the surface visibly reflects the new freshness. This is the
 * SAME operator intent applied to the Cash Deployment surface, motivated by an operational
 * failure (stale deployment evidence contributed to missed morning trades).
 *
 * Architecture (deliberate, bounded):
 *   - This is a NEW CONSUMER of the existing PL-OPS-09 targeted re-observation capability, not a
 *     new acquisition mechanism. It supplies a bounded symbol set; the evidence appliance owns
 *     re-observation, timestamps, provenance, persistence, and rate-limit safety.
 *   - "Top" means the operator's CURRENT displayed sort/order — the FE only asserts "these are the
 *     opportunities at the head of the view I'm using," never a canonical/best ranking.
 *   - The symbol set is chosen by the caller (CrossEntryStrip, which owns the sort/filter chain)
 *     and hard-capped upstream. Backend re-observes exactly those symbols.
 *   - After acquisition completes, the caller re-reads ITS OWN authoritative evidence path
 *     (WriteDesk's snapshot poll). Cash Deployment and the Operator Console consume the same
 *     backend evidence through DIFFERENT frontend readers, so each surface must re-read its own
 *     source — there is no shared frontend generation. onRefreshComplete performs that re-read.
 *
 * Honest boundaries: no new backend endpoint; evidence keeps its real timestamps/provenance;
 * a failed/absent re-observation preserves prior evidence (the surface's freshness simply will
 * not advance for that symbol). Only a genuine ACQUIRED disposition triggers the re-read.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { forceEvidenceAcquisition, type ForceAcquisitionResult } from "../evidence/nudge-acquisition";

type Phase = "idle" | "acquiring" | "done";

const RESULT_LINGER_MS = 6000;

const IDLE_LABEL = "Refresh top opportunities";
const BUSY_LABEL = "Refreshing…";

function resultLabel(result: ForceAcquisitionResult, requested: number): string {
  if (!result.ok) return "Refresh failed";
  switch (result.outcome) {
    case "ACQUIRED":
      return result.symbolsAcquired > 0
        ? `Refreshed ${result.symbolsAcquired}`
        : "Refreshed (up to date)";
    case "PROVIDER_UNAVAILABLE":
      return "Provider unavailable";
    case "NOT_RUNNING":
      return "Appliance offline";
    case "INTERRUPTED":
      return `Refreshing ${requested}… (still running)`;
    default:
      return "Done";
  }
}

export function CrossEntryRefreshButton({
  symbols,
  onRefreshComplete,
  className = "wd-download-btn",
}: {
  /** Deduped underlying symbols for the first-N rows under the current sort. */
  symbols: string[];
  /**
   * Called after a genuine ACQUIRED disposition so the Deployment surface re-reads its OWN
   * authoritative evidence path (WriteDesk snapshot poll) and recomputes promptly, rather than
   * waiting for the passive 30s catch-up.
   */
  onRefreshComplete: () => void;
  className?: string;
}) {
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
    if (symbols.length === 0) return;
    if (resetTimer.current) {
      clearTimeout(resetTimer.current);
      resetTimer.current = null;
    }
    setPhase("acquiring");
    setLabel(BUSY_LABEL);

    // Targeted re-observation of exactly the on-screen (top-N, current-sort) symbols via the
    // shipped PL-OPS-09 path. No new acquisition mechanism.
    const result = await forceEvidenceAcquisition(symbols);

    // Only re-read when the appliance actually acquired. Other dispositions (offline, provider
    // unavailable) leave evidence unchanged by design, so a re-read would be misleading.
    if (result.ok && result.outcome === "ACQUIRED") {
      onRefreshComplete();
    }

    setPhase("done");
    setLabel(resultLabel(result, symbols.length));
    resetTimer.current = setTimeout(() => {
      setPhase("idle");
      setLabel(IDLE_LABEL);
    }, RESULT_LINGER_MS);
  }, [phase, symbols, onRefreshComplete]);

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={phase === "acquiring" || symbols.length === 0}
      aria-busy={phase === "acquiring"}
      title="Re-observe the underlying symbols of the top opportunities currently shown (bounded set, current sort), then re-read fresh evidence. Reuses the evidence appliance's targeted re-observation; keeps real timestamps and provenance."
    >
      {label}
    </button>
  );
}
