/**
 * RowRefreshButton — per-row surgical re-observation for Cash Deployment (PL-OPS-09 consumer).
 *
 * Sits immediately to the right of a row's Age value (e.g. "6m ↻"). Clicking re-observes the
 * SINGLE underlying symbol of that row through the existing PL-OPS-09 targeted path, then prompts
 * the Deployment surface to re-read/recompute — so the operator can surgically refresh the one
 * opportunity they're considering (e.g. a final pre-execution revalidation before Open in
 * Fidelity) without rerunning the whole top-window refresh.
 *
 * Same architecture as the bulk control: a one-symbol set is just another FE consumer of the
 * shared backend capability. No new backend code, no row-specific acquisition API, no new cache
 * semantics.
 *
 * COMPLETION SEMANTICS (learned from working software): action completion and visible-state
 * convergence are DIFFERENT events. The operator reads the spinner as "this row is now current,"
 * so the spinner must track visible-state convergence — this row's displayed acquisition age
 * actually advancing — NOT merely the acquisition request returning. Sequence:
 *
 *   click ↻ → spinner → evidence acquired → surface re-read/recompute → THIS row's provenance
 *   advances → spinner stops (success).
 *
 * If acquisition succeeds but the row's provenance does not advance within a bounded wait (e.g.
 * a provider cache hit inside the 90s chain-cache window, or a failed re-acquisition), the
 * spinner stops in an INDETERMINATE state — it must never declare clean success before the
 * evidence visible to the operator has finished updating.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { forceEvidenceAcquisition } from "../evidence/nudge-acquisition";
import type { EvidenceProvenance } from "./evidence-provenance";

type Phase = "idle" | "acquiring" | "awaiting-convergence" | "indeterminate" | "failed";

const RESULT_LINGER_MS = 2500;
/** How long to wait for the row's visible provenance to advance after a successful acquisition. */
const CONVERGENCE_TIMEOUT_MS = 8000;

/** Extract the comparable acquisition instant (epoch ms) from provenance, or null. */
function acquiredMs(p: EvidenceProvenance | null | undefined): number | null {
  return p && p.kind === "chain-acquired" ? p.acquiredAtMs : null;
}

export function RowRefreshButton({
  symbol,
  provenance,
  onRefreshComplete,
}: {
  /** The single underlying symbol for this row. */
  symbol: string;
  /**
   * This row's CURRENT chain-acquisition provenance. The component watches this prop across
   * recomputes to detect visible-state convergence (the age actually advancing).
   */
  provenance: EvidenceProvenance | null | undefined;
  /**
   * Called after a genuine ACQUIRED disposition so the Deployment surface re-reads its own
   * authoritative evidence path and recomputes (which advances this row's provenance).
   */
  onRefreshComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  // Acquisition instant observed at click time; convergence = provenance newer than this.
  const baselineMsRef = useRef<number | null>(null);
  const lingerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const convergeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (lingerTimer.current) { clearTimeout(lingerTimer.current); lingerTimer.current = null; }
    if (convergeTimer.current) { clearTimeout(convergeTimer.current); convergeTimer.current = null; }
  };
  useEffect(() => () => clearTimers(), []);

  // Visible-state convergence: while awaiting, stop (success) the moment THIS row's provenance
  // advances past the click-time baseline. Runs on every recompute that changes `provenance`.
  const current = acquiredMs(provenance);
  useEffect(() => {
    if (phase !== "awaiting-convergence") return;
    const baseline = baselineMsRef.current;
    if (current != null && (baseline == null || current > baseline)) {
      clearTimers();
      setPhase("idle"); // spinner stops only now — the visible age has actually advanced
    }
  }, [phase, current]);

  const onClick = useCallback(async (e: React.MouseEvent) => {
    // The row itself is clickable (opens the drawer); a refresh click must not also select.
    e.stopPropagation();
    if (phase === "acquiring" || phase === "awaiting-convergence" || !symbol) return;
    clearTimers();

    baselineMsRef.current = acquiredMs(provenance);
    setPhase("acquiring");

    const result = await forceEvidenceAcquisition([symbol]);

    if (!(result.ok && result.outcome === "ACQUIRED")) {
      // Honest failure — evidence unchanged, do not re-read, do not imply success.
      setPhase("failed");
      lingerTimer.current = setTimeout(() => setPhase("idle"), RESULT_LINGER_MS);
      return;
    }

    // Acquisition returned success. Trigger the surface re-read and now WAIT for the row's
    // visible provenance to advance — the spinner keeps spinning until then.
    onRefreshComplete();
    setPhase("awaiting-convergence");
    convergeTimer.current = setTimeout(() => {
      // Acquired, but the visible age never advanced in time (e.g. provider-cache hit within the
      // 90s window). Stop indeterminate — never a clean "done" the operator would misread.
      setPhase("indeterminate");
      lingerTimer.current = setTimeout(() => setPhase("idle"), RESULT_LINGER_MS);
    }, CONVERGENCE_TIMEOUT_MS);
  }, [phase, symbol, provenance, onRefreshComplete]);

  const spinning = phase === "acquiring" || phase === "awaiting-convergence";
  const glyph = phase === "failed" ? "⚠" : phase === "indeterminate" ? "?" : "↻";
  const title =
    phase === "acquiring" ? `Re-observing ${symbol}…`
    : phase === "awaiting-convergence" ? `Re-observed ${symbol}; waiting for the row to update…`
    : phase === "indeterminate" ? `${symbol} re-observed, but its age did not advance (evidence may be within the provider-cache window)`
    : phase === "failed" ? `Could not refresh ${symbol} — evidence unchanged`
    : `Refresh evidence for ${symbol} now`;

  return (
    <button
      type="button"
      className={
        "wd-row-refresh"
        + (spinning ? " wd-row-refresh-busy" : "")
        + (phase === "failed" ? " wd-row-refresh-failed" : "")
        + (phase === "indeterminate" ? " wd-row-refresh-indeterminate" : "")
      }
      onClick={onClick}
      disabled={spinning}
      aria-busy={spinning}
      aria-label={title}
      title={title}
    >
      {glyph}
    </button>
  );
}
