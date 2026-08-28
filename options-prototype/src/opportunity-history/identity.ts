/**
 * Opportunity-History — Evidence-Input Identity & Idempotency (pure)
 *
 * Ruling 2 (cadence): persist ONE fact per distinct evidence input per surface/policy.
 * Repeated browser evaluation of unchanged evidence is NOT a new historical fact.
 *
 * Evidence-input identity (traced from what Decision actually consumes):
 *   For both CSP and buy-write, the entire evaluated economics of a surface derive from
 *   ONE chain record, whose `retrievedAt` is the backend's authoritative provider-retrieval
 *   timestamp (preserved through the frontend merge, NOT reset to poll time). The underlying
 *   price is embedded inside that chain payload — there is no separate quote input today.
 *
 *   Therefore the evidence-input identity of a surface = the chain record's retrievedAt.
 *   When the backend re-acquires the chain, retrievedAt advances -> new evidence -> new fact.
 *   Twenty polls of the same chain share one retrievedAt -> one fact.
 *
 * Idempotency: observation ids are deterministic. The backend endpoint does INSERT OR IGNORE
 * on the id, so browser retries / remounts / multiple tabs / duplicate clients cannot create
 * duplicate historical facts. Historical rows remain immutable.
 */

/**
 * Stable, order-independent string hash (FNV-1a 32-bit -> base36).
 * Deterministic across runs; adequate for idempotency keys (not cryptographic).
 */
function stableHash(parts: (string | number | null | undefined)[]): string {
  const input = parts.map((p) => (p == null ? "\u0000" : String(p))).join("\u001f");
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // 32-bit FNV prime multiply
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

/**
 * Epoch identity — one genuine new-evidence Decision run.
 *
 * Deterministic from (evidenceGeneration, policyVersion, sessionDate). This means a retried
 * POST of the same run reconciles to the same epoch. A policy change or a new evidence
 * generation produces a new epoch id. Repeated evaluation of the SAME generation+policy
 * yields the SAME epoch id (so re-emission is idempotent, not a new epoch).
 *
 * NOTE: startedAt is intentionally NOT part of the id — two evaluations of the same
 * generation+policy are the same epoch regardless of wall-clock. This is what makes the
 * plane evidence-driven rather than execution-driven.
 */
export function deriveEpochId(input: {
  evidenceGeneration: number | null;
  policyVersion: string;
  sessionDate: string;
  provider: string;
  environment: string;
}): string {
  return (
    "ep_" +
    stableHash([
      input.evidenceGeneration,
      input.policyVersion,
      input.sessionDate,
      input.provider,
      input.environment,
    ])
  );
}

/**
 * Surface observation identity.
 *
 * Fingerprint = strategy | symbol | expiration | chainRetrievedAt | policyVersion.
 * Advancing chainRetrievedAt (backend re-acquired) -> new id -> new fact.
 * Same chain re-evaluated -> same id -> INSERT OR IGNORE dedups.
 */
export function deriveSurfaceObservationId(input: {
  strategy: string;
  symbol: string;
  expiration: string;
  chainRetrievedAt: string;
  policyVersion: string;
}): string {
  return (
    "so_" +
    stableHash([
      input.strategy,
      input.symbol,
      input.expiration,
      input.chainRetrievedAt,
      input.policyVersion,
    ])
  );
}

/**
 * Symbol observation identity.
 *
 * Symbol-scope facts (pending / no-DTE / non-optionable / has-evaluable-surfaces) are
 * per-run judgments about the symbol given the run's evidence generation. Keyed to the
 * epoch so the same symbol judgment within one epoch is idempotent, but a new epoch
 * (new generation/policy) records a fresh symbol observation.
 */
export function deriveSymbolObservationId(input: {
  epochId: string;
  symbol: string;
}): string {
  return "sy_" + stableHash([input.epochId, input.symbol]);
}
