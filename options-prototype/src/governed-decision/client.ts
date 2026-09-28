/**
 * Governed-decision HTTP client (shared infrastructure).
 *
 * Thin wrappers over the Evidence Appliance governed-context / governed-decision /
 * association endpoints. These are strategy-family-neutral: they transport opaque
 * governance/decision payloads and never understand LET_RESOLVE/SELL_CALL semantics.
 *
 * Decision emission is best-effort with respect to the operator's Console experience
 * (mirrors opportunity-history emit-client): a failed POST must never break projection.
 * Governance authoring and resolution, by contrast, surface their result to the caller
 * because they are authority-bearing / correctness-relevant.
 */

import type { GovernedContextVersion, GovernedContextDraft } from "./governed-context";
import type { SubjectScopeAssociation } from "./subject";
import type { DecisionInputBundle, DecisionResult } from "./decision-bundle";

/** Result of authoring a Governed Context Version. */
export interface ContextWriteResult {
  ok: boolean;
  contextVersionId?: string;
  version?: number;
  recordedAt?: string;
  violations?: string[];
  error?: string;
}

/**
 * Author (create/version) a Governed Context Version — the explicit authority-bearing
 * governance act. Surfaces validation violations so the UI can refuse to pretend
 * governance was established.
 */
export async function writeGovernedContext(
  draft: GovernedContextDraft,
  fetchImpl: typeof fetch = fetch,
): Promise<ContextWriteResult> {
  try {
    const res = await fetchImpl("/api/governed-context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return {
        ok: false,
        violations: json.violations as string[] | undefined,
        error: (json.error as string) ?? `HTTP ${res.status}`,
      };
    }
    return {
      ok: true,
      contextVersionId: json.contextVersionId as string,
      version: json.version as number,
      recordedAt: json.recordedAt as string,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Resolve the applicable Governed Context Version for a scope as-of a decision boundary,
 * honoring bitemporal discipline (effective <= asOf AND recorded <= knowledge cutoff).
 * Returns null when none applies. Never fabricates governance.
 */
export async function resolveGovernedContext(
  params: {
    brokerageAccountId: string;
    governedScopeId: string;
    effectiveAsOf: string;
    knowledgeCutoff: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<GovernedContextVersion | null> {
  try {
    const q = new URLSearchParams(params as unknown as Record<string, string>);
    const res = await fetchImpl(`/api/governed-context/resolve?${q.toString()}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { resolved: boolean; contextVersion?: GovernedContextVersion };
    return json.resolved && json.contextVersion ? json.contextVersion : null;
  } catch {
    return null;
  }
}

/** Author an explicit Subject->scope association (authorized act; never inferred). */
export async function writeSubjectScopeAssociation(
  a: Omit<SubjectScopeAssociation, "effectiveFrom"> & { effectiveFrom: string },
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; associationId?: string; error?: string }> {
  try {
    const res = await fetchImpl("/api/governed-context/association", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(a),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: (json.error as string) ?? `HTTP ${res.status}` };
    return { ok: true, associationId: json.associationId as string };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Resolve the effective Subject->scope association, or null (no ticker fallback). */
export async function resolveSubjectScope(
  params: { brokerageAccountId: string; subjectId: string; knowledgeCutoff: string },
  fetchImpl: typeof fetch = fetch,
): Promise<SubjectScopeAssociation | null> {
  try {
    const q = new URLSearchParams(params as unknown as Record<string, string>);
    const res = await fetchImpl(`/api/governed-context/association/resolve?${q.toString()}`);
    if (!res.ok) return null;
    const json = (await res.json()) as { resolved: boolean; association?: SubjectScopeAssociation };
    return json.resolved && json.association ? json.association : null;
  } catch {
    return null;
  }
}

/**
 * Emit an immutable governed Decision for durable storage. Best-effort: a failed POST
 * never affects the operator's projection experience (backend is idempotent).
 */
export async function emitGovernedDecision(
  bundle: DecisionInputBundle,
  result: DecisionResult,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const { bundleHash, decisionId } = await import("./decision-bundle").then((m) => ({
      bundleHash: m.bundleHash(bundle),
      decisionId: m.decisionId(bundle),
    }));
    const payload = {
      decisionId,
      brokerageAccountId: bundle.brokerageAccountId,
      governedScopeId: bundle.governedScopeId,
      subjectType: bundle.subject.subjectType,
      subjectId: bundle.subject.subjectId,
      symbol: bundle.subject.symbol,
      // ADR-021 §10: may be null for a no-context UNRESOLVED Decision.
      contextVersionId: bundle.contextVersion ? bundle.contextVersion.contextVersionId : null,
      ruleId: bundle.ruleId,
      evaluatorId: bundle.evaluatorId,
      evaluatorVersion: bundle.evaluatorVersion,
      recommendation: result.recommendation,
      programApplicability: result.programApplicability,
      reasoningJson: JSON.stringify(result.reasons),
      unresolvedCausesJson: JSON.stringify(result.unresolvedCauses),
      predicateResultsJson: JSON.stringify(result.predicateResults),
      inputBundleJson: JSON.stringify(bundle),
      bundleHash,
      decisionTime: bundle.decisionTime,
    };
    const res = await fetchImpl("/api/governed-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Retrieve one persisted Decision (raw backend row) for replay/inspection. */
export async function fetchGovernedDecision(
  decisionId: string,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetchImpl(`/api/governed-decision/${encodeURIComponent(decisionId)}`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Result of the bounded ATTACH TO… program-attachment act. */
export interface AttachResult {
  ok: boolean;
  program?: string;
  configVersion?: string;
  governedScopeId?: string;
  contextVersionId?: string;
  associationId?: string;
  effectiveFrom?: string;
  recordedAt?: string;
  error?: string;
}

/**
 * ATTACH TO… — the bounded operator governance act that establishes that a specific
 * bounded governed subject participates in the ratified Assignment-Centric Wheel v1
 * Program/configuration (Doc 69). One atomic backend transaction mints the durable scope,
 * writes a membership-only Context Version (asserts nothing affirmative), and writes the
 * explicit association. Idempotent. The operator never supplies scope/context/association
 * ids. Surfaces its result to the caller because it is authority-bearing.
 *
 * The backend refuses anything but a bounded covered-call subject in this slice and the
 * ratified program/config, so this wrapper simply transports the operator's intent.
 */
export async function attachProgram(
  req: {
    brokerageAccountId: string;
    subjectId: string;
    subjectType: string;
    /** Effective time of the membership (defaults to now on the backend). */
    effectiveFrom?: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<AttachResult> {
  try {
    const res = await fetchImpl("/api/governed-context/attach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, error: (json.error as string) ?? `HTTP ${res.status}` };
    }
    return {
      ok: true,
      program: json.program as string,
      configVersion: json.configVersion as string,
      governedScopeId: json.governedScopeId as string,
      contextVersionId: json.contextVersionId as string,
      associationId: json.associationId as string,
      effectiveFrom: json.effectiveFrom as string,
      recordedAt: json.recordedAt as string,
    };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** A resolved backend continuity assessment (ADR-022 / Doc 70), or null when none applies. */
export interface ResolvedContinuity {
  verdict:
    | "FULL_Q_INTACT_APPLICABLE"
    | "AUTHORITY_MISSING"
    | "EVIDENCE_INSUFFICIENT"
    | "POLICY_UNDEFINED"
    | "EXHAUSTED";
  evidenceHash: string;
  admissionRuleVersion: string;
}

/**
 * Resolve the backend-owned option-obligation continuity verdict for a covered-call series,
 * as-of a decision boundary (ADR-019 bitemporal: effective <= asOf AND recorded <= cutoff).
 * Returns null when the backend has no applicable assessment — the browser then leaves
 * membership AUTHORITY_MISSING and NEVER infers continuity from a series key (ADR-022 §6).
 */
export async function resolveContinuityAssessment(
  params: {
    brokerageAccountId: string;
    /**
     * The governed scope the Decision consumes (Defect 5). Continuity is bound to this exact
     * cohort/scope; a series match alone never establishes membership. Required — a blank scope
     * yields null (fail closed).
     */
    governedScopeId: string;
    underlying: string;
    optionType: string;
    strike: number;
    expiration: string;
    effectiveAsOf: string;
    knowledgeCutoff: string;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<ResolvedContinuity | null> {
  if (!params.governedScopeId) return null;
  try {
    const q = new URLSearchParams({
      brokerageAccountId: params.brokerageAccountId,
      governedScopeId: params.governedScopeId,
      underlying: params.underlying,
      optionType: params.optionType,
      strike: String(params.strike),
      expiration: params.expiration,
      effectiveAsOf: params.effectiveAsOf,
      knowledgeCutoff: params.knowledgeCutoff,
    });
    const res = await fetchImpl(`/api/continuity/resolve?${q.toString()}`);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      resolved: boolean;
      assessment?: { verdict: string; evidenceHash: string; admissionRuleVersion: string };
    };
    if (!json.resolved || !json.assessment) return null;
    return {
      verdict: json.assessment.verdict as ResolvedContinuity["verdict"],
      evidenceHash: json.assessment.evidenceHash,
      admissionRuleVersion: json.assessment.admissionRuleVersion,
    };
  } catch {
    return null;
  }
}
