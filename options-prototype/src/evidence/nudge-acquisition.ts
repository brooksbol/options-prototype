/**
 * force-acquisition — operator-forced one-shot evidence acquisition client.
 *
 * Wraps the backend recovery endpoint (POST /api/evidence/refresh), which runs ONE full
 * acquisition cycle immediately over the currently relevant universe, through the existing
 * provider/cache/persistence paths, deliberately bypassing the scheduler's due-time and
 * market-session gating for that single operator-requested cycle.
 *
 * This is the outage/forgotten-restart recovery action (PL-OPS-08): "acquire the best current
 * evidence Wheelwright can acquire now," including after hours — rather than remaining frozen at
 * the last observation from before the outage.
 *
 * Honest boundaries (see docs/foundations/evidence-appliance.md and PL-OPS-08):
 *   - It does NOT change the scheduler, reopen continuous observation, or weaken automatic
 *     session policy.
 *   - Acquired evidence keeps its real timestamps and provider/session provenance, so an
 *     after-hours acquisition is never mistaken for an observation captured during a missing
 *     interval.
 *   - It does NOT reconstruct a prior gap. The half-day (or whatever) missed during an outage
 *     stays missing until historical recovery (deferred PL-OPS-08) exists.
 *   - If the provider authority is unusable, it reports PROVIDER_UNAVAILABLE rather than forcing
 *     a broken acquisition.
 */

/** Backend forced-acquisition outcome. Mirrors AcquisitionWorker.ForceOutcome. */
export type ForceOutcome = "ACQUIRED" | "NOT_RUNNING" | "PROVIDER_UNAVAILABLE" | "INTERRUPTED";

export type ForceAcquisitionResult =
  | {
      ok: true;
      outcome: ForceOutcome;
      symbolsAcquired: number;
      workQueueDepth: number;
      generation: number;
      sessionPosture: string;
      recoversHistory: boolean;
    }
  | { ok: false; error: string };

/**
 * Trigger one operator-forced acquisition cycle now.
 *
 * Resolves with the backend's honest disposition (what the forced cycle actually did),
 * or an error descriptor on transport failure. Never throws.
 */
export async function forceEvidenceAcquisition(signal?: AbortSignal): Promise<ForceAcquisitionResult> {
  try {
    const res = await fetch("/api/evidence/refresh", { method: "POST", signal });
    if (!res.ok) {
      return { ok: false, error: `Acquisition request failed (HTTP ${res.status})` };
    }
    const data = await res.json().catch(() => ({}));
    return {
      ok: true,
      outcome: (typeof data?.outcome === "string" ? data.outcome : "ACQUIRED") as ForceOutcome,
      symbolsAcquired: typeof data?.symbolsAcquired === "number" ? data.symbolsAcquired : 0,
      workQueueDepth: typeof data?.workQueueDepth === "number" ? data.workQueueDepth : -1,
      generation: typeof data?.generation === "number" ? data.generation : -1,
      sessionPosture: typeof data?.sessionPosture === "string" ? data.sessionPosture : "unknown",
      recoversHistory: data?.recoversHistory === true,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Acquisition request failed" };
  }
}
