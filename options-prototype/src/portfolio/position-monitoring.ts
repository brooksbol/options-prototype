/**
 * Position Monitoring — Domain Module
 *
 * Derives monitoring-specific facts from a PortfolioSnapshot,
 * optionally enriched with live Evidence observations.
 *
 * Pure function. No React, no cache access, no side effects.
 *
 * Domain composition:
 *   Portfolio + Evidence Observations → Position Monitoring → Presentation
 *
 * Produces MonitoredPosition[] with:
 * - Contract State (ADR-013 dimension 1)
 * - Encumbered capital (factual, from portfolio economics)
 * - DTE (derived from expiration - today)
 * - Moneyness (derived from Evidence price observation + contract strike)
 * - Observation provenance (generation, timestamps, acquisition state)
 *
 * Does NOT produce: Decision Pressure, Economic Consequence, freshness
 * classification, or health/attention signals.
 */

import type { PortfolioSnapshot, InventoryPosition } from "../write-desk/types";
import type { ObservationState, AcquisitionStatus } from "../evidence/observation-store";

// --- Types ---

export type PositionType = "put" | "call" | "buy-write";

export type CapitalValuationBasis =
  | "strike"               // Puts: strike × 100 × quantity
  | "market-value-at-import"  // Calls: derived from imported market value
  | "unavailable";         // Cannot compute (missing economics)

export interface MonitoredPosition {
  /** Unique identifier for this position */
  id: string;
  /** Put or call */
  type: PositionType;
  /** Underlying symbol */
  underlying: string;
  /** Option strike price */
  strike: number;
  /** Expiration date (ISO string) */
  expiration: string;
  /** Days to expiration (from today) */
  dte: number;
  /** Number of contracts */
  quantity: number;
  /** Encumbered capital in dollars (null when not computable) */
  encumberedCapital: number | null;
  /** How the capital value was derived */
  capitalValuationBasis: CapitalValuationBasis;
  /** When the capital valuation was captured (snapshot date) */
  capitalAsOf: string | null;

  // --- Moneyness (from Evidence observation) ---

  /** Signed distance from strike as fraction of strike.
   *  Call: (price - strike) / strike
   *  Put: (strike - price) / strike
   *  Positive = ITM, Zero = ATM, Negative = OTM.
   *  null when no market observation available. */
  moneyness: number | null;

  /** The underlying price used to derive moneyness */
  underlyingPrice: number | null;

  /** When the underlying price was observed (ISO timestamp from Evidence) */
  priceObservedAt: string | null;

  /** Evidence generation that produced this observation */
  evidenceGeneration: number | null;

  /** Acquisition status for this symbol's evidence */
  acquisitionStatus: AcquisitionStatus | null;

  /** Most recent acquisition attempt (may differ from priceObservedAt if refresh failed) */
  lastAttemptAt: string | null;

  /** Consecutive acquisition failures since last success */
  failureCount: number;

  // --- Lifecycle ---

  /** Authoritative date when the position was opened (STO date from Activity).
   *  ISO date string (YYYY-MM-DD). Null when Activity evidence is unavailable. */
  openedDate: string | null;
}

// --- Computation ---

/**
 * Derive monitored positions from a portfolio snapshot,
 * optionally enriched with Evidence observations for moneyness.
 *
 * Computes DTE from today's date, encumbered capital from available economics,
 * and moneyness from Evidence price observations when provided.
 *
 * Returns positions sorted by DTE ascending (nearest expiration first).
 */
export function deriveMonitoredPositions(
  snapshot: PortfolioSnapshot,
  observations?: ObservationState | null,
  today: Date = new Date()
): MonitoredPosition[] {
  const positions: MonitoredPosition[] = [];
  const todayMs = today.getTime();

  // Build inventory lookup for call capital derivation
  const inventoryBySymbol = new Map<string, InventoryPosition>();
  for (const inv of snapshot.inventory) {
    inventoryBySymbol.set(inv.symbol.toUpperCase(), inv);
  }

  // Evidence generation (store-level, stamped on all positions from this derivation)
  const generation = observations?.generation ?? null;

  // Process short puts
  for (const put of snapshot.existingPuts) {
    const dte = computeDte(put.expiration, todayMs);
    const encumberedCapital = put.strike * 100 * put.quantity;
    const evidence = resolveEvidence("put", put.underlying, put.strike, observations, generation);

    positions.push({
      id: `put-${put.underlying}-${put.strike}-${put.expiration}`,
      type: "put",
      underlying: put.underlying,
      strike: put.strike,
      expiration: put.expiration,
      dte,
      quantity: put.quantity,
      encumberedCapital,
      capitalValuationBasis: "strike",
      capitalAsOf: snapshot.snapshotDate,
      openedDate: put.openedDate ?? null,
      ...evidence,
    });
  }

  // Process short calls
  for (const call of snapshot.existingCalls) {
    const dte = computeDte(call.expiration, todayMs);
    const inv = inventoryBySymbol.get(call.underlying.toUpperCase());

    let encumberedCapital: number | null = null;
    let capitalValuationBasis: CapitalValuationBasis = "unavailable";
    let capitalAsOf: string | null = null;

    if (inv && inv.economics?.marketValue != null && inv.sharesOwned > 0) {
      // Derive per-share value from broker-reported market value
      const perShare = inv.economics.marketValue / inv.sharesOwned;
      encumberedCapital = perShare * 100 * call.quantity;
      capitalValuationBasis = "market-value-at-import";
      capitalAsOf = snapshot.snapshotDate;
    }

    const evidence = resolveEvidence("call", call.underlying, call.strike, observations, generation);

    // Use provenance-based origin when available. Do not infer BW from coincident state.
    // Only positions with proven same-day share+call transaction evidence are classified as buy-write.
    const isBuyWrite = call.origin === "buy-write";

    positions.push({
      id: `call-${call.underlying}-${call.strike}-${call.expiration}`,
      type: isBuyWrite ? "buy-write" : "call",
      underlying: call.underlying,
      strike: call.strike,
      expiration: call.expiration,
      dte,
      quantity: call.quantity,
      encumberedCapital,
      capitalValuationBasis,
      capitalAsOf,
      openedDate: call.openedDate ?? null,
      ...evidence,
    });
  }

  // Sort by DTE ascending
  positions.sort((a, b) => a.dte - b.dte);

  return positions;
}

// --- Evidence Resolution ---

interface EvidenceFacts {
  moneyness: number | null;
  underlyingPrice: number | null;
  priceObservedAt: string | null;
  evidenceGeneration: number | null;
  acquisitionStatus: AcquisitionStatus | null;
  lastAttemptAt: string | null;
  failureCount: number;
}

/**
 * Resolve Evidence facts for a single position.
 *
 * Three cases:
 * 1. Observations not provided → all fields null/default (backward compat)
 * 2. Symbol in observations with price → compute moneyness + full provenance
 * 3. Symbol in observations without price → preserve acquisition facts, moneyness null
 * 4. Symbol NOT in observations → all fields null/default (should not happen with correct wiring)
 */
function resolveEvidence(
  type: PositionType,
  underlying: string,
  strike: number,
  observations: ObservationState | null | undefined,
  generation: number | null
): EvidenceFacts {
  const none: EvidenceFacts = {
    moneyness: null,
    underlyingPrice: null,
    priceObservedAt: null,
    evidenceGeneration: null,
    acquisitionStatus: null,
    lastAttemptAt: null,
    failureCount: 0,
  };

  if (!observations) return none;

  const obs = observations.observations.get(underlying.toUpperCase());
  if (!obs) return none;

  // Symbol is in the observation set — preserve acquisition facts regardless of price
  const facts: EvidenceFacts = {
    moneyness: null,
    underlyingPrice: obs.price,
    priceObservedAt: obs.observedAt,
    evidenceGeneration: generation,
    acquisitionStatus: obs.acquisitionStatus,
    lastAttemptAt: obs.lastAttemptAt,
    failureCount: obs.failureCount,
  };

  // Compute moneyness only when price is available
  if (obs.price != null && strike > 0) {
    if (type === "call") {
      facts.moneyness = (obs.price - strike) / strike;
    } else {
      facts.moneyness = (strike - obs.price) / strike;
    }
  }

  return facts;
}

// --- Rung Grouping ---

export interface ExpirationRung {
  /** Expiration date (ISO string) */
  expiration: string;
  /** DTE for this expiration */
  dte: number;
  /** Positions in this rung */
  positions: MonitoredPosition[];
  /** Total encumbered capital in this rung (null values excluded from sum) */
  totalCapital: number;
  /** Number of positions with computable capital */
  capitalizedCount: number;
}

/**
 * Group monitored positions into expiration-native rungs.
 * One rung per distinct expiration date, ordered by DTE ascending.
 */
export function groupByExpiration(positions: MonitoredPosition[]): ExpirationRung[] {
  const rungMap = new Map<string, MonitoredPosition[]>();

  for (const pos of positions) {
    const existing = rungMap.get(pos.expiration);
    if (existing) {
      existing.push(pos);
    } else {
      rungMap.set(pos.expiration, [pos]);
    }
  }

  const rungs: ExpirationRung[] = [];
  for (const [expiration, rungPositions] of rungMap) {
    const dte = rungPositions[0].dte;
    const capitalizedPositions = rungPositions.filter(p => p.encumberedCapital != null);
    const totalCapital = capitalizedPositions.reduce((sum, p) => sum + p.encumberedCapital!, 0);

    rungs.push({
      expiration,
      dte,
      positions: rungPositions,
      totalCapital,
      capitalizedCount: capitalizedPositions.length,
    });
  }

  // Sort by DTE ascending
  rungs.sort((a, b) => a.dte - b.dte);

  return rungs;
}

// --- Helpers ---

function computeDte(expiration: string, todayMs: number): number {
  const expMs = new Date(expiration + "T16:00:00").getTime(); // Market close time
  return Math.max(0, Math.ceil((expMs - todayMs) / (1000 * 60 * 60 * 24)));
}
