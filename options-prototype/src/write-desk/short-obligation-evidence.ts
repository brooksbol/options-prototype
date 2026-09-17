/**
 * Short-Obligation Evidence Adapter — assembles the read-only evidence context
 * that the pure HOLD-vs-CLOSE evaluator consumes.
 *
 * Governing design: docs/design/existing-short-obligation-hold-vs-close-v1-design.md
 *
 * This is the (async) I/O seam between cached evidence + backend authority and
 * the PURE `evaluateShortObligationConsequences`. Keeping I/O here preserves the
 * evaluator's determinism and testability (mirrors how the recommendation
 * engines read the cache while the domain math stays pure).
 *
 * It performs NO provider calls (read/capture only), NEVER mutates portfolio or
 * cache state, and consumes the SAME backend per-subject admissibility authority
 * the recommendation engines use (`isSubjectAdmissible`) rather than re-deriving
 * session/admissibility policy (ADR-017). Greek/IV evidence is read via the RAW
 * path (provider exact 0 / null preserved; §12 whole-vector rule) — never via the
 * per-field display sanitizer.
 */

import type { DurableMarketCache, CacheRecord, SubjectAdmissibility } from "../cache/durable-cache";
import { buildCacheKey } from "../cache/durable-cache";
import { isSubjectAdmissible } from "./subject-admissibility";
import { chainAcquiredProvenance, PROVENANCE_UNAVAILABLE, type EvidenceProvenance } from "./evidence-provenance";
import { rawExportGreeks, type RawContractGreeks } from "./option-greeks";
import type { MarketSessionClassification } from "../market-session/session-policy";
import type { ActivityRow } from "../csv/fidelity/activityParser";
import { detectLifecycleAmbiguity, type ObligationContractKey } from "../portfolio/lifecycle-ambiguity";
import {
  classifyQuoteGeometry,
  isAllFiveZeroVector,
  type ShortObligation,
  type ShortObligationEvidence,
  type GreekIvEnrichment,
  type AdmissibilityDiagnosis,
} from "./short-obligation-consequences";

/** Chain-cache namespace (shared with contract-greek-lookup / the engines). */
const CHAIN_PROVIDER = "tradier";
const CHAIN_ENVIRONMENT = "sandbox";

/** Cached chain contract row shape (the fields we read). Matches the engine reads. */
interface CachedContract extends RawContractGreeks {
  strike: number;
  bid?: number | null;
  ask?: number | null;
}

interface CachedChainPayload {
  puts?: CachedContract[];
  calls?: CachedContract[];
}

/** Optional inputs the adapter carries through to the evaluator context. */
export interface ShortObligationEvidenceInputs {
  /** Authoritative post-checkpoint brokerage Activity (for the §14a guard). */
  activityRows?: readonly ActivityRow[] | null;
  /** Option Summary checkpoint date (provenance.optionSummaryExportTimestamp). */
  checkpointQuoteDate?: string | null;
  /** Gross opening credit for the obligation, where derivable. */
  openingCredit?: number | null;
  /**
   * Attribution quality of `openingCredit` (Codex #4). A position-level /
   * blended broker basis is `blended` (never `known`); a lot/contract-attributed
   * value is `authoritative`. Defaults to `blended` when a value is supplied.
   */
  openingCreditAttribution?: "authoritative" | "blended" | "unavailable";
  /** Externally-authoritative assignment intent (never inferred). Default "unknown". */
  assignmentIntent?: "unknown" | "assignment-desired" | "assignment-unwanted";
}

/**
 * Map a backend session classification to the admissibility context fields the
 * engines use. IDENTICAL mapping to WriteDesk.currentAuthority so authority
 * precedence is consistent (ADR-017).
 */
function toAdmissibilityFields(sc: MarketSessionClassification): {
  useSessionValidity: boolean;
  admissibilityBoundaryMs: number | null;
  authorityPending: boolean;
} {
  const sessionClosed =
    sc.state === "CLOSED_CANONICAL" ||
    sc.state === "NON_TRADING_DAY" ||
    sc.state === "PREMARKET" ||
    sc.state === "REGULAR_OPEN_DELAY";
  return {
    useSessionValidity: sessionClosed,
    admissibilityBoundaryMs: sc.admissibilityBoundaryEpochMs ?? null,
    authorityPending: sc.authorityPending ?? false,
  };
}

/**
 * Assemble the evidence context for one existing short obligation.
 *
 * Read-only. Consumes cached chain evidence + backend admissibility authority +
 * authoritative Activity for the §14a guard. Never mutates. Returns a fully
 * populated `ShortObligationEvidence` (with honest `unavailable`/refusal states)
 * ready for the pure evaluator.
 */
export async function buildShortObligationEvidence(
  obligation: ShortObligation,
  cache: DurableMarketCache,
  sessionClassification: MarketSessionClassification,
  inputs: ShortObligationEvidenceInputs = {}
): Promise<ShortObligationEvidence> {
  const { useSessionValidity, admissibilityBoundaryMs, authorityPending } =
    toAdmissibilityFields(sessionClassification);

  // Read the chain record for this obligation's expiration (single read).
  const chainKey = buildCacheKey(CHAIN_PROVIDER, CHAIN_ENVIRONMENT, "chain", obligation.symbol, obligation.expiration);
  const record = (await cache.get<CachedChainPayload>(chainKey)) ?? null;

  // Backend per-subject admissibility verdict — consumed, never re-derived (ADR-017).
  const admissible = isSubjectAdmissible(record as CacheRecord | null, {
    authorityPending,
    useSessionValidity,
    admissibilityBoundaryMs,
    cache,
  });

  // Fine-grained diagnosis of WHY evidence is/ isn't usable (Codex #7). This does
  // not change the gate outcome; it names the actual observed cause of a refusal.
  const admissibilityDiagnosis = diagnoseAdmissibility(record as CacheRecord | null, {
    admissible,
    authorityPending,
    cache,
  });

  // Option-leg provenance (ADR-015): authoritative chain-acquisition moment only.
  const optionProvenance: EvidenceProvenance =
    record?.evidenceProvenance && record.evidenceProvenance.kind === "chain-acquired"
      ? record.evidenceProvenance
      : PROVENANCE_UNAVAILABLE;

  // Locate the exact contract (side + strike) within the chain payload.
  const contracts = record?.payload
    ? obligation.side === "put"
      ? record.payload.puts
      : record.payload.calls
    : undefined;
  const match = contracts?.find((c) => c.strike === obligation.strike) ?? null;

  // C1/C2 — quote geometry + structural quality classification (§11, §16 case 6).
  const quote = classifyQuoteGeometry(match?.bid ?? null, match?.ask ?? null);

  // Observed spot (for moneyness). Spot has NO independent authoritative provenance
  // (ADR-015 known gap) — carry it as `unavailable`, never laundered from chain age.
  const underlyingPrice = readUnderlyingPrice(record);
  const spotProvenance = PROVENANCE_UNAVAILABLE;

  // Greek/IV enrichment via the RAW path (provider exact 0/null preserved; §12).
  const enrichment = buildEnrichment(match, optionProvenance);

  // §14a — lifecycle-ambiguity determination from AUTHORITATIVE Activity, exact
  // contract only, no inference, no mutation.
  const contractKey: ObligationContractKey = {
    side: obligation.side,
    underlying: obligation.symbol,
    strike: obligation.strike,
    expiration: obligation.expiration,
  };
  const lifecycle = detectLifecycleAmbiguity(
    contractKey,
    inputs.activityRows ?? [],
    inputs.checkpointQuoteDate ?? null
  );

  const openingCredit = inputs.openingCredit ?? null;
  const openingCreditAttribution =
    inputs.openingCreditAttribution ?? (openingCredit != null ? "blended" : "unavailable");

  return {
    lifecycle,
    admissible,
    authorityPending,
    admissibilityDiagnosis,
    quote,
    optionProvenance,
    observedSpot: underlyingPrice,
    spotProvenance,
    enrichment,
    openingCredit,
    openingCreditAttribution,
    assignmentIntent: inputs.assignmentIntent ?? "unknown",
  };
}

/**
 * Diagnose the specific admissibility cause, describing the ACTUAL evidence path
 * that failed — never inferring backend rejection from the final boolean (Codex
 * correction #3). Precedence mirrors the fail-closed gate:
 *   - admissible → `admissible`
 *   - authority pending → `authority-pending`
 *   - no record at all → `missing-evidence`
 *   - EXPLICIT backend `admissible:false` verdict → `backend-inadmissible`
 *     (this is the ONLY path that names a backend rejection).
 *   - anything else that is still inadmissible (explicit `admissible:true` but the
 *     live cache is unusable; or NO verdict and the sealed/boundary/freshness
 *     fallback failed) → `cache-unusable` (locally unusable evidence). We do NOT
 *     attribute these to the backend, because the backend did not reject them.
 */
function diagnoseAdmissibility(
  record: CacheRecord | null,
  ctx: { admissible: boolean; authorityPending: boolean; cache: DurableMarketCache }
): AdmissibilityDiagnosis {
  if (ctx.admissible) return "admissible";
  if (ctx.authorityPending) return "authority-pending";
  if (!record) return "missing-evidence";
  const verdict = (record as { admissibility?: SubjectAdmissibility }).admissibility;
  // ONLY an explicit backend `admissible:false` verdict is a backend rejection.
  if (verdict && verdict.admissible === false) return "backend-inadmissible";
  // Everything else that still failed the gate is locally-unusable evidence:
  //  - explicit `admissible:true` but the live-session cache TTL is expired; or
  //  - no verdict and the sealed-session / boundary / freshness fallback failed.
  // The backend did not reject these, so we do not say it did.
  return "cache-unusable";
}

/** Build greek/IV enrichment from the matched contract using the RAW path (§12). */
function buildEnrichment(
  match: CachedContract | null,
  optionProvenance: EvidenceProvenance
): GreekIvEnrichment | null {
  if (!match) return null;
  const greeks = rawExportGreeks(match);
  const chainAcquiredAtMs =
    optionProvenance.kind === "chain-acquired" ? optionProvenance.acquiredAtMs : null;
  return {
    greeks,
    // Whole-vector rule: only an EXACT all-five-zero vector is an unavailable
    // placeholder; a single zero is genuine data (null ≠ 0).
    allFiveZeroPlaceholder: isAllFiveZeroVector(greeks),
    chainAcquiredAtMs,
  };
}

/** Read the underlying spot from the chain payload, if present. */
function readUnderlyingPrice(record: CacheRecord<CachedChainPayload> | null): number | null {
  const payload = record?.payload as (CachedChainPayload & { underlying?: { price?: number } }) | undefined;
  const price = payload?.underlying?.price;
  return price != null && Number.isFinite(price) && price > 0 ? price : null;
}

// Re-export the provenance helper so component tests can build fixtures consistently.
export { chainAcquiredProvenance };
