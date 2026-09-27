/**
 * GovernedRecommendationInspector — the SINGLE right-side governed Recommendation drawer.
 *
 * It owns BOTH inspection and governance establishment/update. There is no separate
 * governance modal and no second drawer. It is OPERATOR-FIRST (Principal corrective UX):
 *
 *   1. the recommendation and a plain-English summary;
 *   2. for UNRESOLVED, a plain-English explanation of what WW needs and, when the current
 *      authority supports it, the one meaningful operator question (desired call-away
 *      disposition — "Do you want <SYMBOL> to be called away at $<strike>?");
 *   3. secondary, collapsed "Technical details" (raw subject/scope/context/gate state);
 *   4. secondary, collapsed "Advanced governance" holding the bounded raw governance form.
 *
 * It never fabricates questions for undefined governed conditions and never instructs the
 * operator to choose CLEAR. Where policy is undefined it holds at UNRESOLVED and explains
 * the boundary. Governance writes go through the backend (append-only, successor Context
 * Versions; historical governance/replay never mutated). This is presentation/interaction
 * only — no Doc 65 semantics change here.
 */

import { useState } from "react";
import type { ResolvedGovernedRecommendation } from "../governed-decision/resolve";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import { GovernanceForm } from "./GovernanceForm";
import { explainForOperator, callAwayQuestion } from "./governed-drawer-language";
import "./governed-recommendation-inspector.css";

export function GovernedRecommendationInspector({
  resolved,
  onClose,
  /** Present when an account exists, enabling the (advanced) governance act. */
  brokerageAccountId,
  /** Bump the governance epoch so the Console re-resolves after a governed write. */
  onAuthored,
  /** Strike for the call-away question, when the subject is a covered call. */
  callAwayStrike,
}: {
  resolved: ResolvedGovernedRecommendation;
  onClose: () => void;
  brokerageAccountId?: string | null;
  onAuthored?: () => void;
  callAwayStrike?: number | null;
}) {
  const { subject, evaluation, bundle } = resolved;
  const ctx = bundle?.contextVersion ?? null;
  const hasGovernance = ctx != null;
  const canGovern = !!brokerageAccountId;

  const explanation = explainForOperator(evaluation.recommendation, evaluation.unresolvedCauses, subject);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  // Operator's captured call-away answer (bounded: desired disposition). This is captured
  // interaction state; it does not by itself write governance (see the boundary note below).
  const [callAwayAnswer, setCallAwayAnswer] = useState<"yes" | "no" | "unsure" | null>(null);

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

        {/* Operator-first: plain-English summary. */}
        <p className="gri-headline">{explanation.headline}</p>

        {evaluation.recommendation === "UNRESOLVED" && (
          <section className="gri-operator">
            <h3>What WW needs</h3>
            <ul className="gri-plain-reasons">
              {explanation.reasons.map((r, i) => <li key={i}>{r}</li>)}
            </ul>

            {explanation.canAskCallAway && (
              <div className="gri-question">
                <p className="gri-question-text">{callAwayQuestion(subject, callAwayStrike ?? null)}</p>
                <div className="gri-choices" role="group" aria-label="call-away disposition">
                  {(["yes", "no", "unsure"] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className={`gri-choice${callAwayAnswer === choice ? " gri-choice-selected" : ""}`}
                      aria-pressed={callAwayAnswer === choice}
                      onClick={() => setCallAwayAnswer(choice)}
                    >
                      {choice === "yes" ? "Yes" : choice === "no" ? "No" : "Not sure"}
                    </button>
                  ))}
                </div>
                {callAwayAnswer != null && (
                  <p className="gri-question-followup">
                    {callAwayAnswer === "yes"
                      ? "Noted: you want this position called away. Recording that as durable governance still needs the rest of the Wheel scope to be established for this account — see Advanced governance below. WW will not turn this into an affirmative recommendation until that governance truthfully exists."
                      : "Understood. WW will keep this UNRESOLVED — it will not recommend selling/holding toward call-away against your stated intent."}
                  </p>
                )}
              </div>
            )}

            {explanation.hasUndefinedPolicyBoundary && (
              <p className="gri-boundary">
                Some governed conditions this decision would depend on are not yet defined in
                WW's ratified rules, so WW deliberately holds at UNRESOLVED rather than guessing.
              </p>
            )}
          </section>
        )}

        {/* Secondary: technical inspection, collapsed by default. */}
        <div className="gri-details">
          <button type="button" className="gri-disclosure" aria-expanded={showDetails} onClick={() => setShowDetails((v) => !v)}>
            Technical details
          </button>
          {showDetails && (
          <>
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

          <div className="gri-reasons">
            <h4>{evaluation.recommendation === "UNRESOLVED" ? "Machine causes" : "Machine basis"}</h4>
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
          </div>
          </>
          )}
        </div>

        {/* Secondary: bounded raw governance act, collapsed. NOT the primary workflow. */}
        {canGovern && (
          <div className="gri-details">
            <button type="button" className="gri-disclosure" aria-expanded={showAdvanced} onClick={() => setShowAdvanced((v) => !v)}>
              Advanced governance {hasGovernance ? "(amend)" : "(establish)"}
            </button>
            {showAdvanced && (
              <>
                <p className="gri-advanced-note">
                  This is the low-level governance record. The operator-facing setup experience is
                  still in design (PL-SETUP-01); for now this bounded form is the durable write path.
                </p>
                <GovernanceForm
                  brokerageAccountId={brokerageAccountId!}
                  subjectId={subject.subjectId}
                  subjectLabel={subjectLabel}
                  amend={hasGovernance}
                  onAuthored={() => onAuthored?.()}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
