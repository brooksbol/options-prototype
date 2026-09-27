/**
 * Governed-recommendation resolution (browser orchestration, pure core).
 *
 * Maps a real Console subject (covered-call obligation or unencumbered share block) plus
 * its resolved governance (Context Version + association) into a bounded GovernedEvaluation
 * and the replay-bound DecisionInputBundle.
 *
 * This layer builds the authoritative mechanical/evidence FACTS from the snapshot (ADR-020
 * ownership authority) and current moneyness, then delegates the actual decision to the
 * pure evaluators. It never fabricates governance and never infers association.
 */

import type { PortfolioSnapshot } from "../write-desk/types";
import type { MonitoredPosition } from "../portfolio/position-monitoring";
import type { GovernedContextVersion } from "./governed-context";
import type { DecisionSubject } from "./subject";
import {
  evaluateCoveredCall,
  evaluateSharePhase,
  type CoveredCallFacts,
  type ShareBlockFacts,
  type GovernedInputsBase,
} from "./evaluators";
import type { GovernedEvaluation } from "./types";
import type { DecisionInputBundle } from "./decision-bundle";

/** Resolved governance for a subject (from the client layer). */
export interface ResolvedGovernance {
  context: GovernedContextVersion | null;
  associationEstablished: boolean;
}

/** A fully-resolved governed recommendation for one subject (projection + persistence). */
export interface ResolvedGovernedRecommendation {
  subject: DecisionSubject;
  evaluation: GovernedEvaluation;
  bundle: DecisionInputBundle | null; // null when there is no context to pin
}

/** Build the covered-call subject identity from a MonitoredPosition. */
export function coveredCallSubject(
  position: MonitoredPosition,
  brokerageAccountId: string,
): DecisionSubject {
  return {
    subjectType: "covered-call",
    subjectId: position.id, // `call-<underlying>-<strike>-<expiration>`
    symbol: position.underlying,
    brokerageAccountId,
  };
}

/** Build the share-block subject identity for a symbol's unencumbered inventory. */
export function shareBlockSubject(symbol: string, brokerageAccountId: string): DecisionSubject {
  return {
    subjectType: "share-block",
    subjectId: `shares-${symbol.toUpperCase()}`,
    symbol: symbol.toUpperCase(),
    brokerageAccountId,
  };
}

/** Authoritative covered-call facts from the snapshot. */
export function coveredCallFacts(
  position: MonitoredPosition,
  snapshot: PortfolioSnapshot,
): CoveredCallFacts {
  const inv = snapshot.inventory.find(
    (i) => i.symbol.toUpperCase() === position.underlying.toUpperCase(),
  );
  // Coverage is authoritative only when ADR-020 ownership establishes enough owned shares
  // for the short-call obligation. We never infer ownership from the call geometry itself.
  const callContracts = snapshot.existingCalls
    .filter((c) => c.underlying.toUpperCase() === position.underlying.toUpperCase())
    .reduce((sum, c) => sum + Math.abs(c.quantity), 0);
  const requiredShares = callContracts * 100;
  const coverageEstablished =
    inv != null && inv.ownershipAuthority != null && inv.sharesOwned >= requiredShares && requiredShares > 0;
  // Current-ness: the call is present in the reconciled snapshot (this is the authoritative
  // current-state projection). BUG-001 lifecycle-projection gaps are out of scope; when the
  // snapshot cannot establish current-ness the caller supplies a fresh authoritative
  // checkpoint. moneyness available => we have a supported underlying observation.
  const callIsCurrent = inv != null || callContracts > 0;
  const evidenceSufficient = position.moneyness != null && coverageEstablished;
  return { callIsCurrent, coverageEstablished, evidenceSufficient };
}

/** Authoritative share-block facts from the snapshot (ADR-020). */
export function shareBlockFacts(symbol: string, snapshot: PortfolioSnapshot): ShareBlockFacts {
  const inv = snapshot.inventory.find((i) => i.symbol.toUpperCase() === symbol.toUpperCase());
  const freeShares = inv?.sharesFree ?? 0;
  const ownershipAuthority = inv?.ownershipAuthority ?? null;
  // Evidence is sufficient for the phase decision when ownership is authoritatively known.
  const evidenceSufficient = ownershipAuthority != null;
  return { freeShares, ownershipAuthority, evidenceSufficient };
}

/**
 * Resolve a covered-call subject to a governed recommendation + bundle.
 */
export function resolveCoveredCallRecommendation(
  position: MonitoredPosition,
  snapshot: PortfolioSnapshot,
  brokerageAccountId: string,
  governance: ResolvedGovernance,
  decisionTime: string,
): ResolvedGovernedRecommendation {
  const subject = coveredCallSubject(position, brokerageAccountId);
  const facts = coveredCallFacts(position, snapshot);
  const inputs: GovernedInputsBase = {
    context: governance.context,
    associationEstablished: governance.associationEstablished,
  };
  const evaluation = evaluateCoveredCall(facts, inputs);
  // ADR-021 §10: a bundle/Decision is always built, including no-context UNRESOLVED.
  const bundle = buildBundle(subject, snapshot, governance.context, inputs.associationEstablished,
    { kind: "covered-call", facts }, evaluation, decisionTime);
  return { subject, evaluation, bundle };
}

/**
 * Resolve a share-block subject to a governed recommendation + bundle.
 */
export function resolveSharePhaseRecommendation(
  symbol: string,
  snapshot: PortfolioSnapshot,
  brokerageAccountId: string,
  governance: ResolvedGovernance,
  decisionTime: string,
): ResolvedGovernedRecommendation {
  const subject = shareBlockSubject(symbol, brokerageAccountId);
  const facts = shareBlockFacts(symbol, snapshot);
  const inputs: GovernedInputsBase = {
    context: governance.context,
    associationEstablished: governance.associationEstablished,
  };
  const evaluation = evaluateSharePhase(facts, inputs);
  const bundle = buildBundle(subject, snapshot, governance.context, inputs.associationEstablished,
    { kind: "share-block", facts }, evaluation, decisionTime);
  return { subject, evaluation, bundle };
}

function buildBundle(
  subject: DecisionSubject,
  snapshot: PortfolioSnapshot,
  context: GovernedContextVersion | null,
  associationEstablished: boolean,
  consumed: DecisionInputBundle["consumed"],
  evaluation: GovernedEvaluation,
  decisionTime: string,
): DecisionInputBundle {
  const inv = snapshot.inventory.find((i) => i.symbol.toUpperCase() === subject.symbol.toUpperCase());
  return {
    brokerageAccountId: subject.brokerageAccountId,
    subject,
    governedScopeId: context ? context.governedScopeId : null,
    contextVersion: context,
    associationEstablished,
    consumed,
    evidenceProvenance: {
      ownershipAuthority: inv?.ownershipAuthority ?? null,
      optionSummaryCheckpoint: snapshot.provenance?.optionSummaryExportTimestamp ?? null,
      evidenceGeneration: null,
    },
    ruleId: evaluation.ruleId,
    evaluatorId: evaluation.evaluatorId,
    evaluatorVersion: evaluation.evaluatorVersion,
    decisionTime,
  };
}
