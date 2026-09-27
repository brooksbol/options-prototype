/**
 * GovernedRecommendationInspector — the SINGLE right-side governed Recommendation drawer.
 *
 * DENSE, FLAT, OPERATOR-FIRST (Principal corrective UX):
 *   - Compact tag + subject summary + one-line headline.
 *   - NEEDS: what governed facts are required and their plain-English status.
 *   - The one meaningful operator question (desired call-away disposition) when the current
 *     authority supports it.
 *   - BASIS: compact account/subject/program/context/rule facts.
 *   - WHY UNRESOLVED: one line.
 *
 * NO accordions/disclosures. NO raw governance engineering on the operator surface — no
 * scope-id entry, no configuration version, no CLEAR/ACTIVE/UNKNOWN gate controls, no
 * "fails closed", no raw Record-governance form. Where no operator-facing workflow exists
 * without PL-SETUP-01, the drawer STOPS at the honest boundary ("Not established / WW will
 * not infer") rather than exposing internal machinery.
 *
 * Presentation only; reads already-resolved values. No Doc 65 semantics change. Opaque
 * system-managed identifiers stay system-managed. "Recognition is not authority."
 */

import { useState } from "react";
import type { ResolvedGovernedRecommendation } from "../governed-decision/resolve";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import { explainForOperator, callAwayQuestion, subjectSummary } from "./governed-drawer-language";
import "./governed-recommendation-inspector.css";

export function GovernedRecommendationInspector({
  resolved,
  onClose,
  /** Strike for the call-away question, when the subject is a covered call. */
  callAwayStrike,
}: {
  resolved: ResolvedGovernedRecommendation;
  onClose: () => void;
  /** brokerageAccountId retained by callers for future use; not needed by the read-only drawer. */
  brokerageAccountId?: string | null;
  onAuthored?: () => void;
  callAwayStrike?: number | null;
}) {
  const { subject, evaluation, bundle } = resolved;
  const ctx = bundle?.contextVersion ?? null;
  const explanation = explainForOperator(evaluation.recommendation, evaluation.unresolvedCauses, subject);
  const isUnresolved = evaluation.recommendation === "UNRESOLVED";

  const [callAwayAnswer, setCallAwayAnswer] = useState<"yes" | "no" | "unsure" | null>(null);

  return (
    <div className="gri-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gri-panel" onClick={(e) => e.stopPropagation()}>
        <header className="gri-header">
          <span className="gri-title">Governed Recommendation</span>
          <button className="gri-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="gri-top">
          <span className={`grc-tag grc-tag-${evaluation.recommendation.toLowerCase().replace("_", "-")}`}>
            {RECOMMENDATION_LABEL[evaluation.recommendation]}
          </span>
          <span className="gri-subject">{subjectSummary(subject)}</span>
        </div>

        <p className="gri-headline">{explanation.headline}</p>

        {isUnresolved && explanation.needs.length > 0 && (
          <section className="gri-block">
            <h3 className="gri-block-title">Needs</h3>
            <dl className="gri-rows">
              {explanation.needs.map((n, i) => (
                <div className="gri-row" key={i}>
                  <dt>{n.label}</dt>
                  <dd>{n.status}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {isUnresolved && explanation.canAskCallAway && (
          <section className="gri-block gri-question">
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
              <p className="gri-note">
                {callAwayAnswer === "yes"
                  ? "Recorded as your current intent. This states what you want now — it does not by itself establish the governed Wheel scope this call belongs to, so WW keeps the recommendation unresolved until that governance exists."
                  : "Noted. WW will keep this unresolved and will not recommend toward call-away against your intent."}
              </p>
            )}
          </section>
        )}

        <section className="gri-block">
          <h3 className="gri-block-title">Basis</h3>
          <dl className="gri-rows">
            <div className="gri-row"><dt>Account</dt><dd>{subject.brokerageAccountId}</dd></div>
            <div className="gri-row"><dt>Subject</dt><dd>{subjectSummary(subject)}</dd></div>
            <div className="gri-row"><dt>Program</dt><dd>{ctx ? ctx.program.program : "—"}</dd></div>
            <div className="gri-row"><dt>Context</dt><dd>{ctx ? `v${ctx.version}` : "—"}</dd></div>
            <div className="gri-row"><dt>Rule</dt><dd>{evaluation.ruleId}</dd></div>
          </dl>
        </section>

        {isUnresolved && explanation.whyUnresolved && (
          <section className="gri-block">
            <h3 className="gri-block-title">Why unresolved</h3>
            <p className="gri-why">{explanation.whyUnresolved}</p>
          </section>
        )}
      </div>
    </div>
  );
}
