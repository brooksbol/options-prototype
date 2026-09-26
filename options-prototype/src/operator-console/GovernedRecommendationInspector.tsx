/**
 * GovernedRecommendationInspector — inspection drawer for one governed Recommendation.
 *
 * Shows the governing basis so the operator can understand what was recommended and why,
 * or why it is UNRESOLVED. Presentation only; reads the already-resolved recommendation.
 *
 * The inspection SHELL is strategy-family-neutral (it explains subject / scope / context /
 * rule / evaluator / reasons for any governed Decision). The reason CONTENT is Wheel-specific,
 * which is expected.
 */

import type { ResolvedGovernedRecommendation } from "../governed-decision/resolve";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import "./governed-recommendation-inspector.css";

export function GovernedRecommendationInspector({
  resolved,
  onClose,
  onGovern,
}: {
  resolved: ResolvedGovernedRecommendation;
  onClose: () => void;
  /** Open the governance-authoring act for this subject (present when an account exists). */
  onGovern?: () => void;
}) {
  const { subject, evaluation, bundle } = resolved;
  const ctx = bundle?.contextVersion ?? null;

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

        {onGovern && (
          <div className="gri-actions">
            <button className="gri-govern" onClick={onGovern}>
              {evaluation.recommendation === "UNRESOLVED" ? "Establish governance…" : "Amend governance…"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
