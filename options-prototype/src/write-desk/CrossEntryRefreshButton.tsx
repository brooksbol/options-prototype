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
 *   - The symbol set is chosen by the caller (CrossEntryStrip) and hard-capped upstream.
 *
 * COMPLETION SEMANTICS (visual-design-principles #12 — the same discipline as the row control):
 * operator-facing success must correspond to VISIBLE-STATE CONVERGENCE, not request completion,
 * and must be bounded so it can never hang. So the label progression is:
 *
 *   click            → "Refreshing…"        (acquisition request in flight)
 *   request returned → "Updating evidence…" (surface re-read kicked off; convergence pending)
 *   requested rows' visible provenance advances → "Refreshed N" (honest success)
 *   only some advanced within the bound       → "Refreshed N of M" (explicit partial)
 *   none advanced within the bound            → "Not confirmed fresh" (explicit unresolved)
 *
 * Epistemic humility about the backend disposition (Codex finding): a backend `ACQUIRED` is only
 * an ACQUISITION DISPOSITION — it can arise from a bounded-wait timeout or an execution path that
 * still reports ACQUIRED, and `symbolsAcquired === 0` does NOT prove evidence was already current.
 * So we NEVER translate ACQUIRED directly into "Refreshed N" / "up to date". Success is claimed
 * ONLY when the requested rows' visible provenance actually advances. The number reported is the
 * count of symbols whose VISIBLE provenance advanced — not the backend's `symbolsAcquired`.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { forceEvidenceAcquisition } from "../evidence/nudge-acquisition";
import { acquiredMs, type SymbolProvenanceMap } from "./refresh-convergence";

type Phase = "idle" | "acquiring" | "converging" | "done";

const RESULT_LINGER_MS = 6000;
const IDLE_LABEL = "Refresh top opportunities";

/**
 * Default convergence bound. Intentionally set to EXCEED WriteDesk's re-read backoff schedule
 * (delays [300,900,1800,3500,6000] → last snapshot fetch fires at ~12.5s cumulative). If this
 * bound were shorter than that (e.g. the row control's 8s), the bulk button could declare a
 * false "partial" while the surface re-read still had attempts pending. 13s gives the full
 * re-read schedule time to land before we report a partial/unresolved outcome. (Codex MINOR:
 * make the 12.5s-vs-8s relationship intentional — this is that alignment.)
 */
const DEFAULT_BULK_CONVERGENCE_TIMEOUT_MS = 13000;

export function CrossEntryRefreshButton({
  symbols,
  provenanceBySymbol,
  onRefreshComplete,
  convergenceTimeoutMs = DEFAULT_BULK_CONVERGENCE_TIMEOUT_MS,
  className = "wd-download-btn",
}: {
  /** Deduped underlying symbols for the first-N rows under the current sort (the request set). */
  symbols: string[];
  /**
   * Live map of symbol → current chain-acquisition instant (epoch ms) for the displayed rows.
   * Updated on every recompute; the button compares it against a click-time baseline to detect
   * visible-state convergence without any per-symbol accounting machinery.
   */
  provenanceBySymbol: SymbolProvenanceMap;
  /**
   * Called after a genuine ACQUIRED disposition so the Deployment surface re-reads its OWN
   * authoritative evidence path (WriteDesk snapshot poll) and recomputes promptly.
   */
  onRefreshComplete: () => void;
  /** Upper bound on the convergence wait (ms). Injectable for deterministic testing. */
  convergenceTimeoutMs?: number;
  className?: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [label, setLabel] = useState<string>(IDLE_LABEL);
  // Per-symbol click-time acquisition baselines; convergence = a symbol's provenance exceeding it.
  const baselineRef = useRef<Map<string, number | null>>(new Map());
  const requestedRef = useRef<string[]>([]);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const convergeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest provenance map, kept in a ref so the bounded-timeout closure reads CURRENT provenance
  // (the timer is scheduled at click time; the map advances via recompute after that).
  const provRef = useRef<SymbolProvenanceMap>(provenanceBySymbol);
  provRef.current = provenanceBySymbol;

  const clearTimers = () => {
    if (resetTimer.current) { clearTimeout(resetTimer.current); resetTimer.current = null; }
    if (convergeTimer.current) { clearTimeout(convergeTimer.current); convergeTimer.current = null; }
  };
  useEffect(() => () => clearTimers(), []);

  /** How many requested symbols have visibly advanced past their click-time baseline. */
  const convergedCount = (): number => {
    let n = 0;
    for (const sym of requestedRef.current) {
      const baseline = baselineRef.current.get(sym) ?? null;
      const now = acquiredMs(provRef.current.get(sym));
      if (now != null && (baseline == null || now > baseline)) n++;
    }
    return n;
  };

  const settle = (finalLabel: string) => {
    clearTimers();
    setPhase("done");
    setLabel(finalLabel);
    resetTimer.current = setTimeout(() => { setPhase("idle"); setLabel(IDLE_LABEL); }, RESULT_LINGER_MS);
  };

  // Visible-state convergence watcher: while converging, claim success only when ALL requested
  // rows have advanced. Runs on every recompute that changes the provenance map.
  useEffect(() => {
    if (phase !== "converging") return;
    const total = requestedRef.current.length;
    if (total > 0 && convergedCount() >= total) {
      settle(`Refreshed ${total}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, provenanceBySymbol]);

  const onClick = useCallback(async () => {
    if (phase === "acquiring" || phase === "converging") return;
    if (symbols.length === 0) return;
    clearTimers();

    // Capture click-time baselines for exactly the requested symbols.
    const requested = [...symbols];
    requestedRef.current = requested;
    const baseline = new Map<string, number | null>();
    for (const sym of requested) baseline.set(sym, acquiredMs(provenanceBySymbol.get(sym)));
    baselineRef.current = baseline;

    setPhase("acquiring");
    setLabel("Refreshing…");

    const result = await forceEvidenceAcquisition(requested);

    // ACQUIRED is only an acquisition disposition — NOT proof that new evidence is visible yet.
    // Never render "Refreshed N" here. Kick the surface re-read and wait for visible convergence.
    if (!(result.ok && result.outcome === "ACQUIRED")) {
      const failLabel =
        !result.ok ? "Refresh failed"
        : result.outcome === "PROVIDER_UNAVAILABLE" ? "Provider unavailable"
        : result.outcome === "NOT_RUNNING" ? "Appliance offline"
        : "Not confirmed fresh";
      settle(failLabel);
      return;
    }

    onRefreshComplete();
    setPhase("converging");
    setLabel("Updating evidence…");

    convergeTimer.current = setTimeout(() => {
      // Bounded: convergence did not (fully) establish in time. Report the HONEST partial count
      // of rows whose visible provenance actually advanced — never a blanket success, never
      // "up to date", never eternal.
      const total = requestedRef.current.length;
      const converged = convergedCount();
      settle(converged === 0 ? "Not confirmed fresh" : `Refreshed ${converged} of ${total}`);
    }, convergenceTimeoutMs);
  }, [phase, symbols, provenanceBySymbol, onRefreshComplete, convergenceTimeoutMs]);

  const busy = phase === "acquiring" || phase === "converging";

  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={busy || symbols.length === 0}
      aria-busy={busy}
      title="Re-observe the underlying symbols of the top opportunities currently shown (bounded set, current sort), then re-read fresh evidence. Success is claimed only when the visible rows actually show newer evidence — never merely because the request returned."
    >
      {label}
    </button>
  );
}
