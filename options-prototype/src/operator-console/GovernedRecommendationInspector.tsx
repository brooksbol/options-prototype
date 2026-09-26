/**
 * GovernedRecommendationInspector — the SINGLE governed Recommendation drawer.
 *
 * It owns BOTH:
 *   1. governed-decision inspection (why this recommendation / why UNRESOLVED); and
 *   2. governance establishment/update — via the embedded GovernanceForm.
 *
 * There is no separate governance modal and no second drawer. The drawer is
 * inspection-first: it explains the recommendation and (for UNRESOLVED) why governance
 * is missing, then offers the governance act inline in the SAME panel.
 *
 * Presentation only for the recommendation itself; reads the already-resolved value. The
 * inspection SHELL is strategy-family-neutral; the reason CONTENT is Wheel-specific
 * (expected). Governance writes go through GovernanceForm -> backend (append-only,
 * successor Context Versions; historical governance/replay never mutated).
 */

import { useState } from "react";
import type { ResolvedGovernedRecommendation } from "../governed-decision/resolve";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import { GovernanceForm } from "./GovernanceForm";
import "./governed-recommendation-inspector.css";

export function GovernedRecommendationInspector({
  resolved,
  onClose,
  /** Present when an account exists, enabling the inline governance act. */
  brokerageAccountId,
  /** Bump the governance epoch so the Console re-resolves after a governed write. */
  onAuthored,
}: {
  resolved: ResolvedGovernedRecommendation;
  onClose: () => void;
  brokerageAccountId?: string | null;
  onAuthored?: () => void;
}) {
  const { subject, evaluation, bundle } = resolved;
  const ctx = bundle?.contextVersion ?? null;
  const hasGovernance = ctx != null;
  const canGovern = !!brokerageAccountId;

  // Inspection-first: the governance act is revealed on demand rather than replacing the
  // explanation immediately (Principal: "Do not immediately replace the explanation with
  // a giant form.").
  const [showForm, setShowForm] = useState(false);

  const subjectLabel =
    subject.subjectType === "covered-call"
      ? `covered call ${subject.symbol}`
      : `unencumbered ${subject.symbol} shares`;

  return (
    <div className="gri-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gri-panel" onClick={(e) => e.stopPropagation()}>
        <header className="gri-header">
          <h2>Governed Recommendation</h2>
          <button className="gri-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="gri-recommendation" data-recommendation={evaluation.recommendation}>
          {RECOMMENDATION_LABEL[evaluation.recommendation]}
        </div>

        <dl className="gri-facts">
          <dt>Decision Subject</dt>
          <dd>{subject.subjectType} · {subject.symbol} · <code>{subject.subjectId}</code></dd>

          <dt>Account</dt>
          <dd><code>{subject.brokerageAccountId}</code></dd>

          <dt>Governed scope</dt>
          <dd>{ctx ? <code>{ctx.governedScopeId}</code> : <em>none associated</em>}</dd>

          <dt>Context version</dt>
          <dd>
            {ctx
              ? <><code>{ctx.contextVersionId}</code> (v{ctx.version}, effective {ctx.effectiveFrom})</>
              : <em>no applicable governed context</em>}
          </dd>

          <dt>Program / configuration</dt>
          <dd>{ctx ? `${ctx.program.program} · cfg ${ctx.program.configVersion}` : <em>—</em>}</dd>

          <dt>Outcome stance (call-away)</dt>
          <dd>{ctx ? ctx.callAwayStance : <em>—</em>}</dd>

          <dt>Gates</dt>
          <dd>
            {ctx
              ? `eligibility=${ctx.eligibilityGate} · intervention=${ctx.interventionGate} · no-write=${ctx.noWriteGate}`
              : <em>—</em>}
          </dd>

          <dt>Rule / evaluator</dt>
          <dd>{evaluation.ruleId} · {evaluation.evaluatorId}@{evaluation.evaluatorVersion}</dd>

          {evaluation.recommendation === "SELL_CALL" && (
            <>
              <dt>Contract selection</dt>
              <dd><em>UNRESOLVED / no current admissible candidate</em> (SELL CALL ≠ WHICH CALL?)</dd>
            </>
          )}
        </dl>

        <section className="gri-reasons">
          <h3>{evaluation.recommendation === "UNRESOLVED" ? "Why unresolved" : "Why this recommendation"}</h3>
          <ul>
            {evaluation.reasons.map((r, i) => (
              <li key={i}><span className="gri-basis">[{r.basis}]</span> {r.text}</li>
            ))}
          </ul>
          {evaluation.unresolvedCauses.length > 0 && (
            <ul className="gri-causes">
              {evaluation.unresolvedCauses.map((c, i) => (
                <li key={i}><code>{c}</code></li>
              ))}
            </ul>
          )}
        </section>

        {canGovern && !showForm && (
          <div className="gri-actions">
            <button className="gri-govern" onClick={() => setShowForm(true)}>
              {hasGovernance ? "Amend governance…" : "Establish governance…"}
            </button>
          </div>
        )}

        {canGovern && showForm && (
          <GovernanceForm
            brokerageAccountId={brokerageAccountId!}
            subjectId={subject.subjectId}
            subjectLabel={subjectLabel}
            amend={hasGovernance}
            onAuthored={() => {
              setShowForm(false);
              onAuthored?.();
            }}
          />
        )}
      </div>
    </div>
  );
}
