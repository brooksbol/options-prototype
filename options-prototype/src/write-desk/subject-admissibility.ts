/**
 * Per-subject admissibility consumption (Issue #16).
 *
 * The BACKEND owns whether a given evidence subject (chain) is admissible/canonical,
 * derived from that subject's OWN provider authority + acquisition time under session
 * policy. It publishes the verdict on each chain (`admissibility`), which snapshot
 * ingestion carries onto the cache record. Deployment must CONSUME that verdict rather
 * than re-derive admissibility from a provider-delay profile.
 *
 * AUTHORITY PRECEDENCE (the rule Codex re-review established, and the durable lesson):
 *
 *   Authoritative verdicts OUTRANK legacy/local fallback semantics. Fallback exists only
 *   in the ABSENCE of authority; it may never override authority.
 *
 * Concretely, evaluated strictly in this order:
 *
 *   0. Authority pending (no authoritative /api/status session yet): FAIL CLOSED. Nothing
 *      is recommendation-eligible before backend authority has arrived. The frontend must
 *      not invent market/session fallback semantics while authority is pending — that is
 *      what made a "conservative" fabricated CLOSED_CANONICAL bootstrap accidentally
 *      permissive (sealed-session validity trusted prior cached evidence).
 *
 *   1. Backend per-subject verdict present → AUTHORITATIVE, checked BEFORE any sealed
 *      session shortcut. `admissible: false` stays inadmissible in open/delayed/closed/
 *      sealed conditions alike. `admissible: true` still requires cache-usability
 *      (transport freshness is a separate concern from admissibility authority).
 *
 *   2. No backend verdict → legacy fallback ONLY: sealed-session validity, else the
 *      backend-sourced session boundary + freshness. This path exists solely where
 *      authoritative subject authority is genuinely absent (expirations/absence records,
 *      older snapshots, or a backend build without session context).
 */

import type { CacheRecord, DurableMarketCache } from "../cache/durable-cache";

export interface AdmissibilityContext {
  /**
   * True until the first authoritative /api/status session has been received. While
   * pending, eligibility is false (fail closed) — no fabricated session fallback.
   */
  authorityPending: boolean;
  /** True when the backend session is closed/sealed — sealed evidence is valid by definition. */
  useSessionValidity: boolean;
  /** Backend-sourced session-level boundary (fallback only, when no per-subject verdict). */
  admissibilityBoundaryMs: number | null;
  cache: DurableMarketCache;
}

/**
 * Decide whether a cached evidence record may participate in recommendation generation.
 */
export function isSubjectAdmissible(record: CacheRecord | null | undefined, ctx: AdmissibilityContext): boolean {
  if (!record) return false;

  // (0) Authority pending → fail closed. No record is eligible before backend authority.
  if (ctx.authorityPending) return false;

  const freshness = ctx.cache.freshness(record);
  const cacheUsable = freshness === "fresh" || freshness === "stale_usable";

  // (1) Backend per-subject verdict is AUTHORITATIVE and checked FIRST — it outranks the
  //     sealed-session fallback.
  if (record.admissibility) {
    // (1a) admissible:false → inadmissible in EVERY session state.
    if (!record.admissibility.admissible) return false;
    // (1b) admissible:true in a SEALED/closed session → the backend has authoritatively
    //      sealed this subject for the session, so it stays admissible even if the
    //      live-session transport TTL has expired. Applying live-cache freshness here
    //      would destroy sealed-evidence semantics (Friday's sealed close must remain
    //      valid through the weekend). Sealed validity is the accepted behavior.
    if (ctx.useSessionValidity) return true;
    // (1c) admissible:true in a LIVE session → still require ordinary cache usability;
    //      transport freshness is a separate concern from admissibility authority.
    return cacheUsable;
  }

  // (2) No backend verdict → legacy fallback semantics only.
  //     Sealed session: sealed evidence is valid by definition.
  if (ctx.useSessionValidity) return true;
  //     Otherwise: backend-sourced session boundary + freshness.
  if (ctx.admissibilityBoundaryMs != null
      && record.retrievedAt != null
      && record.retrievedAt < ctx.admissibilityBoundaryMs) {
    return false;
  }
  return cacheUsable;
}
