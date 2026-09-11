/**
 * contract-greek-lookup — shared, consumer-agnostic lookup of a single option
 * contract's greeks from cached chain evidence.
 *
 * Both the Operator Console (position rows) and the future Deployment tables need
 * to resolve "the greeks for THIS symbol / expiration / strike / side" from the
 * DurableMarketCache. That matching logic lives here once, so no surface
 * recreates the cache-key convention, the put/call selection, or the
 * strike-match rule. Sanitization/formatting live in option-greeks.ts.
 */

import { getDurableCache, buildCacheKey } from "../cache/durable-cache";
import { sanitizeGreeks, UNAVAILABLE_GREEKS, type OptionGreeks, type RawContractGreeks } from "./option-greeks";

/** A contract we can look up greeks for. */
export interface GreekLookupSubject {
  symbol: string;
  expiration: string;
  strike: number;
  side: "put" | "call";
}

/** Chain-cache namespace shared by all consumers (stable identity, not a live env). */
const PROVIDER = "tradier";
const ENVIRONMENT = "sandbox";

interface CachedContract extends RawContractGreeks {
  strike: number;
}

interface CachedChainPayload {
  puts?: CachedContract[];
  calls?: CachedContract[];
}

/**
 * Greeks plus the AUTHORITATIVE chain-acquisition moment they came from.
 *
 * `chainAcquiredAtMs` is the epoch-ms of the chain's authoritative acquisition
 * provenance (`EvidenceProvenance.kind === "chain-acquired"`), or `null` when no
 * authoritative provenance is available. It is DERIVED FROM the publisher-
 * established provenance carried on the cache record (`evidenceProvenance`), NOT
 * from cache/TTL timing (`retrievedAt`), a symbol-level fallback, or `Date.now()`
 * (see `evidence-provenance.ts` / ADR-015). A record whose provenance is
 * `unavailable` (older snapshot, or non-authoritative) yields `null` — an honest
 * "greek age unknown", never a substituted weaker timestamp.
 *
 * This is DISTINCT from the underlying-quote freshness a surface may show
 * elsewhere: a chain (and thus its greeks) can be materially older than the
 * latest spot. Surfaces must not let a fresh quote imply fresh greeks — use this
 * acquisition age to represent greek freshness honestly.
 */
export interface ContractGreeksResult {
  greeks: OptionGreeks;
  /** Authoritative chain-acquisition epoch-ms, or null when provenance is unavailable. */
  chainAcquiredAtMs: number | null;
}

/**
 * Resolve sanitized greeks for one subject from cached chain evidence.
 * Returns all-unavailable greeks when there is no cached chain, no matching
 * strike, or the payload has no contracts on the requested side.
 *
 * Sanitization (field-level validity) is applied here via the shared
 * option-greeks utilities, so every consumer gets identical semantics.
 */
export async function lookupContractGreeks(subject: GreekLookupSubject): Promise<OptionGreeks> {
  return (await lookupContractGreeksWithAge(subject)).greeks;
}

/**
 * Like {@link lookupContractGreeks} but also returns the chain's acquisition age,
 * so consumers can present greek freshness distinctly from quote freshness.
 */
export async function lookupContractGreeksWithAge(subject: GreekLookupSubject): Promise<ContractGreeksResult> {
  const cache = getDurableCache();
  const key = buildCacheKey(PROVIDER, ENVIRONMENT, "chain", subject.symbol, subject.expiration);
  const record = await cache.get<CachedChainPayload>(key);
  if (!record || !record.payload) return { greeks: { ...UNAVAILABLE_GREEKS }, chainAcquiredAtMs: null };

  // Greek Age is the AUTHORITATIVE chain-acquisition moment, sourced ONLY from the
  // publisher-established provenance on the record. When provenance is unavailable
  // (older snapshot / non-authoritative), age is null — never fall back to
  // record.retrievedAt (cache/TTL timing), a symbol timestamp, or Date.now().
  const provenance = record.evidenceProvenance;
  const chainAcquiredAtMs = provenance && provenance.kind === "chain-acquired" ? provenance.acquiredAtMs : null;

  const contracts = subject.side === "put" ? record.payload.puts : record.payload.calls;
  if (!contracts || contracts.length === 0) return { greeks: { ...UNAVAILABLE_GREEKS }, chainAcquiredAtMs };

  const match = contracts.find(c => c.strike === subject.strike);
  if (!match) return { greeks: { ...UNAVAILABLE_GREEKS }, chainAcquiredAtMs };

  return { greeks: sanitizeGreeks(match), chainAcquiredAtMs };
}
