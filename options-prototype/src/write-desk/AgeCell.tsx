/**
 * Age presentation for Deployment (Write Desk) tables — PL-EVID-AGE.
 *
 * Renders the chain-acquisition age of the evidence a row was calculated from,
 * advancing with wall-clock time via a LOCALIZED ticker. The ticker state lives
 * inside each AgeCell (via a shared subscription store), so age advancement
 * re-renders only the Age cells — never the whole Write Desk, and never any
 * recommendation/decision/acquisition machinery.
 *
 * Observational only: nothing here feeds rank, posture, governance, tiers,
 * scheduler priority, or acquisition. It only reads provenance and formats it.
 */

import { useEffect, useState } from "react";
import { formatAcquisitionAge, type EvidenceProvenance } from "./evidence-provenance";

/** Ticker cadence for Age display (ms). */
export const AGE_TICK_MS = 5000;

// ── Shared wall-clock tick store ────────────────────────────────────────────
// A single interval drives all AgeCells. Subscribers are notified with the
// current epoch ms. This keeps re-render scope to the subscribed cells and
// avoids N intervals. The interval only runs while at least one cell is mounted.

type TickListener = (nowMs: number) => void;

const listeners = new Set<TickListener>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureInterval() {
  if (intervalId != null) return;
  intervalId = setInterval(() => {
    const now = Date.now();
    for (const l of listeners) l(now);
  }, AGE_TICK_MS);
}

function subscribeTick(listener: TickListener): () => void {
  listeners.add(listener);
  ensureInterval();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

/**
 * Localized wall-clock now (epoch ms) that advances on the shared Age ticker.
 * Only components using this hook re-render on tick.
 */
export function useAgeNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    // Sync immediately on mount, then follow the shared ticker.
    setNow(Date.now());
    return subscribeTick(setNow);
  }, []);
  return now;
}

/**
 * Compact, sortable-friendly Age cell content.
 *
 * `unavailable` provenance renders as an em dash — the only truthful rendering
 * when authoritative per-chain provenance is absent.
 */
export function AgeCell({ provenance }: { provenance: EvidenceProvenance | null | undefined }) {
  const now = useAgeNow();
  const label = formatAcquisitionAge(provenance, now);
  const title =
    provenance && provenance.kind === "chain-acquired"
      ? "Time since Wheelwright acquired the option-chain evidence for this row (acquisition age, not market-observation time)."
      : "Chain-acquisition provenance unavailable for this row.";
  return (
    <span className="wd-age" title={title}>
      {label}
    </span>
  );
}
