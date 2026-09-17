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
  /** Provider bid for this contract. number (incl. 0) = observed; null/undefined = unavailable. */
  bid?: number | null;
  /** Provider ask for this contract. number (incl. 0) = observed; null/undefined = unavailable. */
  ask?: number | null;
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
 * A single option contract's bid/ask as carried in cached chain evidence.
 *
 * Each field is `number | null`:
 *   - a finite number (INCLUDING 0) → the provider supplied that quote. A zero
 *     bid is a real market observation (no live buyer), not "unavailable", so it
 *     is preserved as 0 — unlike greeks, there is no zero→null collapse here.
 *   - null → the provider did not supply the field, there is no cached chain, or
 *     no matching strike/side. Honest absence, never a fabricated zero.
 *
 * These are the SAME session-sensitive chain observations as the greeks (same
 * cache record, same acquisition moment); a surface that shows greek age can
 * reuse it for these quotes.
 */
export interface ContractQuote {
  bid: number | null;
  ask: number | null;
}

/** All-unavailable quote (stable reference for empty/placeholder results). */
export const UNAVAILABLE_QUOTE: ContractQuote = Object.freeze({ bid: null, ask: null });

/** Coerce a raw provider bid/ask to `number | null`, preserving an exact 0. */
function quoteNumber(v: number | null | undefined): number | null {
  return v != null && Number.isFinite(v) ? v : null;
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

/**
 * Resolve the option contract's bid/ask for one subject from cached chain
 * evidence — the SAME cache record, key convention, and strike/side match rule
 * used for greeks (there is no second source of truth for a leg's quote).
 *
 * Returns an all-unavailable quote when there is no cached chain, the payload has
 * no contracts on the requested side, or no strike matches. A provider-supplied
 * exact 0 is preserved (a zero bid is real market state, not absence).
 */
export async function lookupContractQuote(subject: GreekLookupSubject): Promise<ContractQuote> {
  const cache = getDurableCache();
  const key = buildCacheKey(PROVIDER, ENVIRONMENT, "chain", subject.symbol, subject.expiration);
  const record = await cache.get<CachedChainPayload>(key);
  if (!record || !record.payload) return { ...UNAVAILABLE_QUOTE };

  const contracts = subject.side === "put" ? record.payload.puts : record.payload.calls;
  if (!contracts || contracts.length === 0) return { ...UNAVAILABLE_QUOTE };

  const match = contracts.find(c => c.strike === subject.strike);
  if (!match) return { ...UNAVAILABLE_QUOTE };

  return { bid: quoteNumber(match.bid), ask: quoteNumber(match.ask) };
}
