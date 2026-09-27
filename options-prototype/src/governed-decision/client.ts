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
