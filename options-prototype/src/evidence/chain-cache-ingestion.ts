/**
 * chain-cache-ingestion — shared snapshot→IndexedDB chain ingestion.
 *
 * Extracted verbatim from the WriteDesk chain-writing logic so that any surface
 * that consumes cached chain evidence (Operator Console, Write Desk) can populate
 * the DurableMarketCache itself, rather than depending on another surface having
 * been visited first.
 *
 * SCOPE: chain records only. Coverage, expirations, and absence ingestion remain
 * WriteDesk concerns (recommendation-funnel inputs). The Operator Console only
 * needs the per-position chain lookup (delta/greeks), so this module writes chains
 * and prunes stale chain records — nothing else. Keeping the scope narrow avoids
 * two divergent implementations of the full merge.
 *
 * PROVENANCE (PL-EVID-AGE / ADR-015): operator-facing provenance is established
 * UPSTREAM by the publisher; the frontend only CONSUMES it. An older snapshot
 * lacking provenance fields is treated as `unavailable`, never reconstructed from
 * a symbol/cache/synthesized timestamp.
 *
 * CACHE NAMESPACE: chain records are keyed under ("tradier", "sandbox") to match
 * the existing WriteDesk ingestion and the Operator Console's read hooks
 * (use-position-deltas). This is a stable identity namespace, not a live
 * environment label.
 */

import { getDurableCache, buildCacheKey } from "../cache/durable-cache";
import { provenanceFromPublished } from "../write-desk/evidence-provenance";

const PROVIDER_KEY = "tradier";
const ENVIRONMENT_KEY = "sandbox";

/**
 * Ingest all chain records from a backend evidence snapshot into the durable
 * cache. Returns the number of ready symbols whose chains were merged.
 *
 * Safe to call from multiple surfaces; the durable cache is a single shared
 * IndexedDB store and writes are idempotent per (symbol, expiration) key.
 */
export async function ingestChainsFromSnapshot(snapshotData: any): Promise<number> {
  const cache = getDurableCache();
  let merged = 0;

  for (const sym of snapshotData?.symbols ?? []) {
    if (sym.status !== "ready" || !sym.chain) continue;

    const backendRetrievedAtMs = sym.retrievedAt ? new Date(sym.retrievedAt).getTime() : undefined;

    // Legacy single-chain path carries the published primary-chain provenance.
    const legacyPrimaryProvenance = provenanceFromPublished(sym.primaryChainAcquisitionProvenance);

    // Cache all chains from the multi-expiration surface. On the legacy
    // single-chain path, synthesize a one-element list from the primary chain.
    const chains = sym.chains ?? [{
      expiration: sym.chain.expiration,
      data: sym.chain,
      retrievedAt: sym.retrievedAt,
      chainAcquisitionProvenance: sym.primaryChainAcquisitionProvenance,
    }];

    const currentExpirations = new Set<string>();

    for (const chainEntry of chains) {
      const chainData = chainEntry.data;
      const chainExp = chainEntry.expiration ?? chainData?.expiration;
      if (!chainData || !chainExp) continue;
      currentExpirations.add(chainExp);

      // Consume the publisher-established provenance for THIS chain. Missing
      // field → unavailable (never a fallback to a weaker timestamp).
      const provenance = Array.isArray(sym.chains)
        ? provenanceFromPublished(chainEntry.chainAcquisitionProvenance)
        : legacyPrimaryProvenance;

      // Issue #16: carry the backend-authoritative per-subject admissibility
      // verdict for THIS chain. The Console CONSUMES it (never re-derives it from
      // a delay policy). Multi-chain surface → per-entry; legacy single-chain →
      // the symbol-level primary verdict. Mirrors the Write Desk ingestion so both
      // surfaces populate identical records (no Issue #16 regression).
      const admissibility = Array.isArray(sym.chains)
        ? chainEntry.admissibility
        : sym.primaryChainAdmissibility;

      // TTL mechanics may still use the symbol fallback — this is NOT Age.
      const chainRetrievedMs = chainEntry.retrievedAt ? new Date(chainEntry.retrievedAt).getTime() : backendRetrievedAtMs;
      const chainKey = buildCacheKey(PROVIDER_KEY, ENVIRONMENT_KEY, "chain", sym.symbol, chainExp);
      const chainRecord = cache.createRecord(
        chainKey, "chain", PROVIDER_KEY, ENVIRONMENT_KEY, sym.symbol, chainExp, chainData, chainRetrievedMs, provenance, admissibility,
      );
      await cache.put(chainRecord);
    }

    // Remove stale chain records for expirations no longer in the current surface.
    const allSymRecords = await cache.getBySymbol(sym.symbol);
    for (const oldRecord of allSymRecords) {
      if (oldRecord.dataType === "chain" && !currentExpirations.has(oldRecord.expiration ?? "")) {
        await cache.delete(oldRecord.key);
      }
    }

    merged++;
  }

  return merged;
}
