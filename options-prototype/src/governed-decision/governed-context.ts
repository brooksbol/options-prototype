/**
 * Governed Context — the durable capture of explicitly authorized governance
 * (Candidate B, Correction 1 & 2).
 *
 * A Governed Context Version is the FIRST durable capture of authorized governance
 * for this bounded slice. There is no separate Program-association or Outcome-Stance
 * assertion store.
 *
 * IDENTITY (Correction 2): governance survives independently of any one Decision via
 *   `brokerageAccountId + governedScopeId`.
 * `governedScopeId` is an opaque durable identity for ONE governed scope. It is NOT a
 * universal Wheel Cycle / Lifecycle Episode / Mandate / strategy instance / Program
 * runtime entity.
 *
 * CREATION IS GOVERNANCE (Correction 1): a Context Version is created ONLY by an
 * explicit authority-bearing act (see `governed-context-client.ts` -> backend
 * `POST /api/governed-context`). It is never an evaluator side effect and never
 * inferred from ownership, covered-call geometry, ticker, `origin:"buy-write"`, a
 * `WHEEL` label, DTE/moneyness, or the absence of an exception.
 *
 * This type is the browser-side view of an immutable persisted Context Version.
 */

import type {
  CallAwayStance,
  GateState,
  GovernanceProvenance,
} from "./types";

/**
 * The bounded Program/configuration identity this slice governs. Only the
 * assignment-centric Wheel is ratified by Doc 65. A `configVersion` distinguishes
 * governance revisions of the same Program identity.
 */
export interface ProgramIdentity {
  /** Bounded to the ratified assignment-centric Wheel for this slice. */
  program: "assignment-centric-wheel";
  /** Program-configuration version label (governance revision, not evaluator version). */
  configVersion: string;
}

/**
 * An immutable Governed Context Version. Amendment creates a NEW version
 * (v1 -> v2); v1 is never mutated (Correction / ADR-019 §5 bitemporal discipline).
 */
export interface GovernedContextVersion {
  /** Account partition key (opaque, stable). Never derived from broker data. */
  brokerageAccountId: string;
  /** Opaque durable scope identity. */
  governedScopeId: string;
  /** Deterministic immutable version identity (hash of content + lineage). */
  contextVersionId: string;
  /** Monotonic version number within the (account, scope) family (1, 2, ...). */
  version: number;
  /** The prior version this one supersedes, or null for the first version. */
  supersedesContextVersionId: string | null;

  program: ProgramIdentity;

  /** Accepted call-away disposition stance for the scope. `unknown` fails closed. */
  callAwayStance: CallAwayStance;

  /** Tri-state governed gates. Missing => UNKNOWN (never CLEAR). */
  eligibilityGate: GateState;
  interventionGate: GateState;
  noWriteGate: GateState;

  /** Who/what authorized this governance. */
  authorityProvenance: GovernanceProvenance;

  /** Effective-time (governance applies from). ISO8601. */
  effectiveFrom: string;
  /** Backend-assigned durable record time (distinct from effectiveFrom). ISO8601. */
  recordedAt: string;
}

/**
 * The minimal governance payload an operator/system must SUPPLY to create a version.
 * Note: no gate defaults to CLEAR; an omitted gate is UNKNOWN. `contextVersionId`,
 * `version`, `recordedAt`, and `supersedesContextVersionId` are assigned durably at
 * write time, not supplied by the caller as authority.
 */
export interface GovernedContextDraft {
  brokerageAccountId: string;
  governedScopeId: string;
  program: ProgramIdentity;
  callAwayStance: CallAwayStance;
  eligibilityGate: GateState;
  interventionGate: GateState;
  noWriteGate: GateState;
  authorityProvenance: GovernanceProvenance;
  effectiveFrom: string;
}

/**
 * Validate a draft as a genuine authority-bearing governance assertion
 * (Correction 1 / governance-abuse guard). Returns the list of violations; empty
 * means acceptable. This is the semantic guard that prevents a Context Version from
 * becoming "positively governed" from mechanical facts or convenience.
 *
 * The guard is deliberately strict: an affirmative governance state requires an
 * explicit authorizing provenance and explicit stance. It does NOT accept an
 * evaluator/browser default or the mere presence of shares/calls/labels — those are
 * not part of this payload at all, which is the point: mechanical facts cannot reach
 * this function.
 */
export function validateGovernedContextDraft(draft: GovernedContextDraft): string[] {
  const violations: string[] = [];

  if (!draft.brokerageAccountId || draft.brokerageAccountId.trim() === "") {
    violations.push("brokerageAccountId is required (no account-agnostic governance)");
  }
  if (!draft.governedScopeId || draft.governedScopeId.trim() === "") {
    violations.push("governedScopeId is required (governance must have a durable scope)");
  }
  if (draft.program?.program !== "assignment-centric-wheel") {
    violations.push("program must be the ratified assignment-centric-wheel for this slice");
  }
  if (!draft.program?.configVersion || draft.program.configVersion.trim() === "") {
    violations.push("program.configVersion is required");
  }
  // Correction 1: authority must be an EXPLICIT operator-governance assertion. A
  // context cannot be authored as broker-evidence/derived/unknown, because those are
  // not authority-bearing governance — they would let mechanical facts masquerade as
  // governance.
  if (draft.authorityProvenance !== "operator-governance") {
    violations.push(
      "authorityProvenance must be 'operator-governance' — governance is an explicit authorized act, " +
        "never derived from broker evidence, derivation, or absence",
    );
  }
  // A governance version that asserts nothing affirmative (stance unknown AND no gate
  // CLEAR) carries no positive governance and would only ever produce UNRESOLVED. That
  // is legitimate to persist as an honest "not yet governed" record, so it is NOT a
  // violation — but callAwayStance must be an explicit allowed value.
  if (draft.callAwayStance !== "accepted" && draft.callAwayStance !== "unknown") {
    violations.push("callAwayStance must be 'accepted' or 'unknown'");
  }
  for (const [name, g] of [
    ["eligibilityGate", draft.eligibilityGate],
    ["interventionGate", draft.interventionGate],
    ["noWriteGate", draft.noWriteGate],
  ] as const) {
    if (g !== "CLEAR" && g !== "ACTIVE" && g !== "UNKNOWN") {
      violations.push(`${name} must be CLEAR | ACTIVE | UNKNOWN`);
    }
  }
  if (!draft.effectiveFrom || Number.isNaN(Date.parse(draft.effectiveFrom))) {
    violations.push("effectiveFrom must be a valid ISO8601 instant");
  }

  return violations;
}
