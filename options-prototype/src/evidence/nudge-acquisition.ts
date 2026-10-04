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

/**
 * Backend forced-acquisition outcome. Mirrors AcquisitionWorker.ForceOutcome.
 *
 * NOT_COMPLETED means the forced operation did not actually finish within the bounded
 * wait (or an error escaped the cycle); work may still be running. It is distinct from
 * ACQUIRED precisely so a timeout is never read as "completed". No after-completion
 * postcondition (e.g. per-symbol held price) is certified for a NOT_COMPLETED result.
 */
export type ForceOutcome =
  | "ACQUIRED"
  | "NOT_RUNNING"
  | "PROVIDER_UNAVAILABLE"
  | "INTERRUPTED"
  | "NOT_COMPLETED";

/**
 * Per-requested-symbol result of a TARGETED refresh (PL-OPS-09).
 *
 * {@link heldPrice} answers only: after the targeted operation completed, does Wheelwright
 * hold this symbol's requested price (same gate as GET /api/evidence/quotes)? It does NOT
 * assert new acquisition, freshness, independent quote age, or trade suitability — a
 * legitimately preserved prior price counts as held. Only meaningful when the enclosing
 * result reports {@link ForceAcquisitionResult.completed} === true.
 */
/**
 * This invocation's per-symbol acquisition outcome (NOT persisted acquisition.status).
 * Mirrors the backend AcquisitionWorker.mapAcquisitionOutcome projection.
 */
export type PerSymbolAcquisitionOutcome =
  | "ACQUIRED"
  | "NO_USABLE_EVIDENCE"
  | "FAILED"
  | "FENCED"
  | "PROVIDER_UNUSABLE"
  | "PERSISTENCE_FAILED"
  | "ABORTED"
  | "UNKNOWN";

export type PerSymbolRefreshResult = {
  symbol: string;
  /**
   * What THIS targeted-refresh invocation's acquisition attempt did for the symbol.
   * Independent of {@link heldPrice}: a FAILED attempt can coexist with heldPrice=true
   * when a prior successful observation is preserved. Never infer acquisition from a held
   * price, and never erase a held price because the attempt failed.
   */
  acquisitionOutcome: PerSymbolAcquisitionOutcome;
  heldPrice: boolean;
};

export type ForceAcquisitionResult =
  | {
      ok: true;
      outcome: ForceOutcome;
      /**
       * True ONLY when the forced operation actually finished. A bounded-wait timeout or
       * escaped error yields completed=false (outcome NOT_COMPLETED). Never treat ACQUIRED
       * alone as proof the work completed — read this flag.
       */
      completed: boolean;
      symbolsAcquired: number;
      workQueueDepth: number;
      generation: number;
      sessionPosture: string;
      recoversHistory: boolean;
      /** True when the refresh was scoped to explicit symbols (targeted), not a whole cycle. */
      targeted: boolean;
      /**
       * Per-requested-symbol held-price postcondition for a COMPLETED targeted refresh.
       * Empty for a whole-cycle refresh or when the targeted operation did not complete
       * (the backend certifies nothing per symbol unless the operation finished).
       */
      perSymbol: PerSymbolRefreshResult[];
    }
  | { ok: false; error: string };

/**
 * Trigger one operator-forced acquisition cycle now.
 *
 * Resolves with the backend's honest disposition (what the forced cycle actually did),
 * or an error descriptor on transport failure. Never throws.
 */
export async function forceEvidenceAcquisition(
  symbols?: string[],
  signal?: AbortSignal,
): Promise<ForceAcquisitionResult> {
  try {
    // Targeted refresh: scope the forced acquisition to the given symbols via repeated
    // ?symbol= query params (POST, because acquisition is side-effecting). With no symbols
    // the endpoint keeps its whole-cycle recovery behavior.
    let url = "/api/evidence/refresh";
    const clean = [...new Set(
      (symbols ?? [])
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0),
    )];
    if (clean.length > 0) {
      const params = clean.map(s => `symbol=${encodeURIComponent(s)}`).join("&");
      url = `${url}?${params}`;
    }

    const res = await fetch(url, { method: "POST", signal });
    if (!res.ok) {
      return { ok: false, error: `Acquisition request failed (HTTP ${res.status})` };
    }
    const data = await res.json().catch(() => ({}));
    const perSymbol: PerSymbolRefreshResult[] = Array.isArray(data?.perSymbol)
      ? data.perSymbol
          .filter((e: unknown): e is { symbol: string; acquisitionOutcome?: unknown; heldPrice?: unknown } =>
            !!e && typeof (e as { symbol?: unknown }).symbol === "string")
          .map((e: { symbol: string; acquisitionOutcome?: unknown; heldPrice?: unknown }) => ({
            symbol: e.symbol,
            // Carry the invocation outcome through verbatim; default to UNKNOWN rather
            // than inventing an outcome. Never derive it from heldPrice.
            acquisitionOutcome: (typeof e.acquisitionOutcome === "string"
              ? e.acquisitionOutcome
              : "UNKNOWN") as PerSymbolAcquisitionOutcome,
            heldPrice: e.heldPrice === true,
          }))
      : [];
    return {
      ok: true,
      outcome: (typeof data?.outcome === "string" ? data.outcome : "ACQUIRED") as ForceOutcome,
      // Honest completion flag. Default to false when absent — never assume completion.
      completed: data?.completed === true,
      symbolsAcquired: typeof data?.symbolsAcquired === "number" ? data.symbolsAcquired : 0,
      workQueueDepth: typeof data?.workQueueDepth === "number" ? data.workQueueDepth : -1,
      generation: typeof data?.generation === "number" ? data.generation : -1,
      sessionPosture: typeof data?.sessionPosture === "string" ? data.sessionPosture : "unknown",
      recoversHistory: data?.recoversHistory === true,
      targeted: data?.targeted === true,
      perSymbol,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Acquisition request failed" };
  }
}
