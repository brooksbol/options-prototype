/**
 * Contingent Calls — Compute projected call rows from portfolio short puts.
 *
 * For each existing short put in the portfolio, evaluates the call landscape
 * that would exist if the put assigned shares at the put strike.
 *
 * Uses the existing conditioned-call-surface machinery:
 *   loadConditionedCallEvidence() + assessConditionedCallSurface()
 *
 * Returns ContingentCallRow[] for integration into the Calls table.
 */

import type { DurableMarketCache } from "../cache/durable-cache";
import type { OpenShortPut } from "./types";
import type { ContractSelectionPolicy } from "./recommend";
import type { ExecutionPolicy } from "./execution-policy";
import {
  loadConditionedCallEvidence,
  assessConditionedCallSurface,
  type ConditionedOwnershipInput,
} from "./conditioned-call-surface";
import { contingentRowFromOpportunity, type ContingentCallRow } from "./call-table-row";

// --- Result ---

export interface ContingentCallsResult {
  /** Contingent rows for the Calls table */
  rows: ContingentCallRow[];
  /** Puts that were evaluated but produced no qualifying calls */
  excludedPuts: Array<{
    underlying: string;
    strike: number;
    expiration: string;
    reason: string;
  }>;
}

// --- Compute ---

/**
 * Compute contingent call rows from existing short puts.
 *
 * For each put, loads call chain evidence and assesses the conditioned surface.
 * Maps representative qualifying opportunities into ContingentCallRow[].
 *
 * Uses strike as the conditioned basis (original premium unavailable from
 * imported portfolio data).
 */
export async function computeContingentCalls(
  existingPuts: OpenShortPut[],
  cache: DurableMarketCache,
  cacheEnvironment: { provider: string; environment: string },
  policy: { contractSelection: ContractSelectionPolicy; executionAssessment: ExecutionPolicy },
  options?: {
    sessionInfo?: { acceptingCanonicalEvidence: boolean; priorSessionOperationallyValid: boolean };
    maxRowsPerPut?: number;
  }
): Promise<ContingentCallsResult> {
  const allRows: ContingentCallRow[] = [];
  const excludedPuts: ContingentCallsResult["excludedPuts"] = [];
  const maxPerPut = options?.maxRowsPerPut ?? 3;

  for (const put of existingPuts) {
    const input: ConditionedOwnershipInput = {
      underlying: put.underlying,
      assumedBasisPerShare: put.strike,
      shareQuantity: Math.abs(put.quantity) * 100,
      basisSource: "strike-only",
      origin: "existing-put",
      sourceExpiration: put.expiration,
      sourceStrike: put.strike,
    };

    try {
      const evidence = await loadConditionedCallEvidence(
        put.underlying,
        cache,
        cacheEnvironment,
        policy.contractSelection.eligibleDteRange,
        options?.sessionInfo
      );

      const surface = assessConditionedCallSurface(input, evidence, policy);

      if (surface.representativeOpportunities.length === 0) {
        excludedPuts.push({
          underlying: put.underlying,
          strike: put.strike,
          expiration: put.expiration,
          reason: surface.evidenceState === "unavailable"
            ? "Call evidence not available"
            : surface.evidenceState === "partial"
              ? "Partial evidence — no qualifying calls found"
              : "No policy-admissible calls above put strike basis",
        });
        continue;
      }

      // Take up to maxPerPut qualifying opportunities per put
      const opportunities = surface.representativeOpportunities.slice(0, maxPerPut);

      for (const opp of opportunities) {
        allRows.push(contingentRowFromOpportunity(opp, {
          underlying: put.underlying,
          strike: put.strike,
          expiration: put.expiration,
          quantity: put.quantity,
        }));
      }
    } catch {
      // PCS failure for this put — skip gracefully
      excludedPuts.push({
        underlying: put.underlying,
        strike: put.strike,
        expiration: put.expiration,
        reason: "Evidence computation failed",
      });
    }
  }

  return { rows: allRows, excludedPuts };
}
