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
 * Greeks plus the acquisition age of the CHAIN they came from.
 *
 * `chainRetrievedAtMs` is the epoch-ms of the chain record's acquisition (null if
 * unknown/no record). This is DISTINCT from the underlying-quote freshness a
 * surface may show elsewhere: a chain (and thus its greeks) can be materially
 * older than the latest spot. Surfaces must not let a fresh quote imply fresh
 * greeks — use this age to represent greek freshness honestly.
 */
export interface ContractGreeksResult {
  greeks: OptionGreeks;
  chainRetrievedAtMs: number | null;
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
  if (!record || !record.payload) return { greeks: { ...UNAVAILABLE_GREEKS }, chainRetrievedAtMs: null };

  const chainRetrievedAtMs = typeof record.retrievedAt === "number" ? record.retrievedAt : null;

  const contracts = subject.side === "put" ? record.payload.puts : record.payload.calls;
  if (!contracts || contracts.length === 0) return { greeks: { ...UNAVAILABLE_GREEKS }, chainRetrievedAtMs };

  const match = contracts.find(c => c.strike === subject.strike);
  if (!match) return { greeks: { ...UNAVAILABLE_GREEKS }, chainRetrievedAtMs };

  return { greeks: sanitizeGreeks(match), chainRetrievedAtMs };
}
