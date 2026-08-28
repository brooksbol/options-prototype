/**
 * Opportunity-History — Emit Client
 *
 * POSTs an assembled batch to the Evidence Appliance for durable, idempotent storage.
 * Fire-and-forget with respect to Decision: emission failure must NEVER affect the
 * operator's recommendation experience. Errors are swallowed (logged at debug only).
 *
 * The backend does INSERT OR IGNORE on deterministic ids, so a retried/duplicated POST
 * is harmless.
 */

import type { OpportunityHistoryBatch } from "./opportunity-fact";

const ENDPOINT = "/api/opportunity-history";

/**
 * Emit a batch. Returns true on 2xx, false on any failure. Never throws.
 * `null` batches (nothing new to persist) are a no-op returning true.
 */
export async function emitOpportunityHistory(
  batch: OpportunityHistoryBatch | null,
  fetchImpl: typeof fetch = fetch
): Promise<boolean> {
  if (!batch) return true; // nothing new — not an error
  try {
    const res = await fetchImpl(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    return res.ok;
  } catch {
    // Emission is best-effort; a failed POST must not affect Decision/operator UX.
    return false;
  }
}
