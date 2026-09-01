/**
 * Operator-facing evidence provenance for Deployment (Write Desk) rows.
 *
 * PL-EVID-AGE — Deployment Evidence Age (first slice, observational only).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EPISTEMIC RULE (application-level, implementing ADR-013 intent):
 *
 *   Internal freshness/cache timestamps and operator-facing evidence provenance
 *   are DISTINCT semantics. A synthesized or fallback timestamp used for cache/
 *   freshness mechanics (e.g. a symbol-level fallback, or a `Date.now()` used to
 *   drive TTL) must NEVER silently become operator-facing (Deployment Age)
 *   evidence provenance.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * First-slice Age semantic:
 *
 *   Age = now − acquiredAtMs of the option-chain record that supported the row
 *         ("chain acquisition age").
 *
 * This is deliberately NARROWER than the desired future semantic ("age of the
 * oldest economically material evidence actually used by the row"). Calls and
 * buy-writes materially use the underlying spot, which the backend folds into
 * the chain record from a separately-cached quote (backend QUOTE TTL 60s) whose
 * independent acquisition time is discarded. And no provider/exchange OBSERVATION
 * timestamp exists anywhere — Wheelwright knows acquisition/receipt time only.
 * Therefore this is acquisition age, not market-observation age, and the label
 * must not claim otherwise. Closing that gap is future work under PL-EVID-AGE.
 *
 * Age is observational ONLY. It must not feed rank, posture, governance, tiers,
 * scheduler priority, quality, or acquisition policy.
 */

/**
 * Explicit provenance state carried from snapshot ingestion through the
 * recommendation/conditioned-call paths onto each Deployment row.
 *
 * Modeled as a discriminated union (not an optional timestamp) so that a missing
 * or non-authoritative timestamp cannot masquerade as legitimate chain
 * provenance. `unavailable` is a first-class, honest state.
 */
export type EvidenceProvenance =
  | { kind: "chain-acquired"; acquiredAtMs: number }
  | { kind: "unavailable" };

/** Convenience singleton for the unavailable state. */
export const PROVENANCE_UNAVAILABLE: EvidenceProvenance = { kind: "unavailable" };

/**
 * Establish operator-facing provenance from an AUTHORITATIVE per-chain
 * timestamp only.
 *
 * `rawChainRetrievedAt` MUST be the original per-chain `chains[].retrievedAt`
 * from the snapshot. Do NOT pass a symbol-level fallback or a synthesized
 * frontend time here — those have no operator-facing provenance authority.
 *
 * Returns `chain-acquired` only when the value parses to a finite, positive
 * epoch-ms timestamp; otherwise `unavailable`.
 */
export function chainAcquiredProvenance(
  rawChainRetrievedAt: string | number | null | undefined
): EvidenceProvenance {
  const ms =
    typeof rawChainRetrievedAt === "number"
      ? rawChainRetrievedAt
      : typeof rawChainRetrievedAt === "string" && rawChainRetrievedAt.length > 0
        ? new Date(rawChainRetrievedAt).getTime()
        : NaN;
  if (Number.isFinite(ms) && ms > 0) {
    return { kind: "chain-acquired", acquiredAtMs: ms };
  }
  return PROVENANCE_UNAVAILABLE;
}

/**
 * Consume publisher-established chain-acquisition provenance (ADR-015).
 *
 * Authority is established UPSTREAM at the evidence/publication boundary. The
 * frontend does NOT decide authority from snapshot shape — it maps the explicit
 * published provenance object onto the display union:
 *
 *   { kind: "chain-acquired", acquiredAt: <iso|epoch> }  → chain-acquired
 *   { kind: "unavailable" }                              → unavailable
 *   missing / malformed (older snapshot)                 → unavailable
 *
 * A missing field (older backend that predates the provenance contract) is
 * treated as `unavailable` — a consumer compatibility rule, never permission to
 * reconstruct provenance from a symbol-level, cache, or synthesized timestamp.
 */
export function provenanceFromPublished(
  published: unknown
): EvidenceProvenance {
  if (
    published &&
    typeof published === "object" &&
    (published as { kind?: unknown }).kind === "chain-acquired"
  ) {
    return chainAcquiredProvenance((published as { acquiredAt?: string | number }).acquiredAt);
  }
  // Explicit "unavailable", missing, or malformed → unavailable.
  return PROVENANCE_UNAVAILABLE;
}

/**
 * Format chain-acquisition age for compact display.
 *
 * `unavailable` provenance renders as an em dash. This is the only truthful
 * rendering when authoritative per-chain provenance is absent.
 *
 * @param provenance operator-facing provenance for the row
 * @param nowMs current wall-clock time (epoch ms); injected so display advances
 *              with a localized ticker and so tests are deterministic
 */
export function formatAcquisitionAge(
  provenance: EvidenceProvenance | null | undefined,
  nowMs: number
): string {
  if (!provenance || provenance.kind !== "chain-acquired") return "—";
  const ageMs = nowMs - provenance.acquiredAtMs;
  const ageSec = Math.max(0, Math.round(ageMs / 1000));
  if (ageSec < 60) return `${ageSec}s`;
  if (ageSec < 3600) return `${Math.round(ageSec / 60)}m`;
  return `${Math.round(ageSec / 3600)}h`;
}

/**
 * Sort key for the Age column.
 *
 * Column semantics are AGE, which is the INVERSE of timestamp ordering:
 * older evidence (smaller acquiredAtMs) = greater age. This returns the
 * age-in-ms sort magnitude relative to `nowMs`, so ascending order = youngest
 * first and descending = oldest first, matching an intuitive "Age" column.
 *
 * `unavailable` rows have no defined age and are pinned to the end regardless of
 * sort direction by returning a sentinel; callers should treat the sentinel as
 * "always last". We express that with a separate flag rather than a magic number.
 */
export function ageSortValue(
  provenance: EvidenceProvenance | null | undefined,
  nowMs: number
): { hasAge: boolean; ageMs: number } {
  if (!provenance || provenance.kind !== "chain-acquired") {
    return { hasAge: false, ageMs: 0 };
  }
  return { hasAge: true, ageMs: Math.max(0, nowMs - provenance.acquiredAtMs) };
}

/**
 * Comparator for Age columns that keeps `unavailable` rows pinned to the end
 * under BOTH sort directions.
 *
 * @param dir "asc" = youngest first (smallest age first); "desc" = oldest first
 */
export function compareAge(
  a: EvidenceProvenance | null | undefined,
  b: EvidenceProvenance | null | undefined,
  dir: "asc" | "desc",
  nowMs: number
): number {
  const av = ageSortValue(a, nowMs);
  const bv = ageSortValue(b, nowMs);
  // Unavailable always sorts to the end, regardless of direction.
  if (!av.hasAge && !bv.hasAge) return 0;
  if (!av.hasAge) return 1;
  if (!bv.hasAge) return -1;
  const cmp = av.ageMs - bv.ageMs; // ascending = youngest first
  return dir === "asc" ? cmp : -cmp;
}
