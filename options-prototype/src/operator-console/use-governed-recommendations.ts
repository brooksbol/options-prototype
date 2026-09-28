/**
 * use-governed-recommendations — Console-owned hook that resolves the bounded governed
 * Recommendation for each in-scope subject (covered-call obligations + unencumbered share
 * blocks) and durably emits the immutable Decision.
 *
 * Flow per subject (Candidate B):
 *   resolve explicit association -> resolve applicable Context Version (bitemporal)
 *   -> build authoritative facts (ADR-020 ownership + moneyness)
 *   -> run the pure bounded evaluator -> project + emit immutable Decision.
 *
 * Fail-closed: missing association / context / evidence => UNRESOLVED. Emission is
 * best-effort and never affects projection (backend is idempotent).
 *
 * Read-only with respect to portfolio/market state; the only write is the durable
 * Decision append (append-only history, not a state mutation).
 */

import { useEffect, useState } from "react";
import type { MonitoredPosition } from "../portfolio/position-monitoring";
import type { PortfolioSnapshot } from "../write-desk/types";
import {
  resolveGovernedContext,
  resolveSubjectScope,
  emitGovernedDecision,
  resolveContinuityAssessment,
} from "../governed-decision/client";
import {
  resolveCoveredCallRecommendation,
  resolveSharePhaseRecommendation,
  type ResolvedGovernedRecommendation,
} from "../governed-decision/resolve";

/** Map from subjectId -> resolved governed recommendation. */
export type GovernedRecommendationMap = ReadonlyMap<string, ResolvedGovernedRecommendation>;

const EMPTY: GovernedRecommendationMap = new Map();

/** Symbols with at least one unencumbered lot are share-block subjects. */
function shareBlockSymbols(snapshot: PortfolioSnapshot): string[] {
  return snapshot.inventory
    .filter((i) => i.sharesFree >= 100)
    .map((i) => i.symbol.toUpperCase());
}

export function useGovernedRecommendations(
  positions: MonitoredPosition[],
  snapshot: PortfolioSnapshot | null,
  generation: number | null,
  /** Bump to force re-resolution after governance is authored (association/context change). */
  governanceEpoch = 0,
): GovernedRecommendationMap {
  const [map, setMap] = useState<GovernedRecommendationMap>(EMPTY);

  const account = snapshot?.brokerageAccountId ?? null;
  const callSubjectsKey = positions
    .filter((p) => p.type === "call" || p.type === "buy-write")
    .map((p) => `${p.id}#${p.moneyness ?? "na"}`)
    .join(",");
  const shareSymbolsKey = snapshot ? shareBlockSymbols(snapshot).join(",") : "";
  const invalidationKey = `${account ?? "no-acct"}::${callSubjectsKey}::${shareSymbolsKey}::gen${generation ?? "null"}::gov${governanceEpoch}`;

  useEffect(() => {
    if (!snapshot || !account) {
      setMap(EMPTY);
      return;
    }
    let cancelled = false;

    (async () => {
      const now = new Date().toISOString();
      const out = new Map<string, ResolvedGovernedRecommendation>();

      const resolveGovernanceFor = async (subjectId: string) => {
        // Knowledge cutoff = now (current projection uses currently-known governance).
        const assoc = await resolveSubjectScope(
          { brokerageAccountId: account, subjectId, knowledgeCutoff: now },
          fetch,
        );
        if (!assoc) return { context: null, associationEstablished: false };
        const context = await resolveGovernedContext(
          {
            brokerageAccountId: account,
            governedScopeId: assoc.governedScopeId,
            effectiveAsOf: now,
            knowledgeCutoff: now,
          },
          fetch,
        );
        return { context, associationEstablished: context != null };
      };

      // Covered-call subjects.
      for (const pos of positions) {
        if (pos.type !== "call" && pos.type !== "buy-write") continue;
        const subjectId = pos.id;
        const governance = await resolveGovernanceFor(subjectId);
        // ADR-022 / Doc 70: membership for a covered-call obligation is the BACKEND-owned
        // continuity verdict, resolved as-of now. Null when unassessed — the browser then
        // leaves membership AUTHORITY_MISSING and never infers continuity from the series key.
        const continuity =
          (await resolveContinuityAssessment(
            {
              brokerageAccountId: account,
              underlying: pos.underlying,
              optionType: "CALL",
              strike: pos.strike,
              expiration: pos.expiration,
              effectiveAsOf: now,
              knowledgeCutoff: now,
            },
            fetch,
          )) ?? undefined;
        const resolved = resolveCoveredCallRecommendation(
          pos, snapshot, account, { ...governance, continuity }, now);
        out.set(subjectId, resolved);
        if (resolved.bundle) {
          void emitGovernedDecision(resolved.bundle, {
            recommendation: resolved.evaluation.recommendation,
            predicateResults: resolved.evaluation.predicateResults,
            programApplicability: resolved.evaluation.programApplicability,
            reasons: resolved.evaluation.reasons,
            unresolvedCauses: resolved.evaluation.unresolvedCauses,
          });
        }
      }

      // Share-block subjects.
      for (const symbol of shareBlockSymbols(snapshot)) {
        const subjectId = `shares-${symbol}`;
        const governance = await resolveGovernanceFor(subjectId);
        const resolved = resolveSharePhaseRecommendation(symbol, snapshot, account, governance, now);
        out.set(subjectId, resolved);
        if (resolved.bundle) {
          void emitGovernedDecision(resolved.bundle, {
            recommendation: resolved.evaluation.recommendation,
            predicateResults: resolved.evaluation.predicateResults,
            programApplicability: resolved.evaluation.programApplicability,
            reasons: resolved.evaluation.reasons,
            unresolvedCauses: resolved.evaluation.unresolvedCauses,
          });
        }
      }

      if (!cancelled) setMap(out);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidationKey]);

  return map;
}
