/**
 * GovernedRecommendationInspector — the SINGLE right-side governed Recommendation drawer.
 *
 * DENSE, FLAT, OPERATOR-FIRST, INSPECTION-RICH (Principal corrective UX):
 *   - Compact state-colored tag + subject summary + one-line headline.
 *   - NEEDS: which governed predicates are missing, in plain-English status rows.
 *   - WHAT WW NEEDS FROM YOU: the operator-language facts WW would need — stated honestly.
 *   - POSITION / EVIDENCE: real observed facts for the subject (inspection).
 *   - GOVERNANCE / BASIS: account/subject/program/context/rule (inspection).
 *   - WHY UNRESOLVED: one line.
 *
 * NO accordions/disclosures. NO raw governance engineering (no scope-id entry, no config
 * version, no CLEAR/ACTIVE/UNKNOWN gate controls, no "fails closed", no raw Record form).
 *
 * IMPORTANT — NO DECORATIVE CONTROLS (this pass's stop condition): a semantic trace found
 * that neither the call-away-intent control nor the Wheel-membership control can be made
 * durable/truthful under current authority (see the journal / Principal Decision Surface).
 * Therefore this drawer presents the missing facts HONESTLY as read-only operator language
 * and does NOT render a clickable answer that cannot persist. It never fabricates a
 * transition. Opaque identifiers stay system-managed. "Recognition is not authority."
 *
 * Presentation only; reads already-resolved values. No Doc 65 semantics change.
 */

import type { ResolvedGovernedRecommendation } from "../governed-decision/resolve";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import { explainForOperator, callAwayQuestion, subjectSummary } from "./governed-drawer-language";
import "./governed-recommendation-inspector.css";

/** A compact label/value inspection row supplied by the Console call site. */
export interface DrawerFactRow {
  label: string;
  value: string;
}

export function GovernedRecommendationInspector({
  resolved,
  onClose,
  /** Strike for the call-away question wording, when the subject is a covered call. */
  callAwayStrike,
  /** Real observed position/evidence facts for the POSITION / EVIDENCE block. */
  evidenceRows,
}: {
  resolved: ResolvedGovernedRecommendation;
  onClose: () => void;
  brokerageAccountId?: string | null;
  callAwayStrike?: number | null;
  evidenceRows?: DrawerFactRow[];
}) {
  const { subject, evaluation, bundle } = resolved;
  const ctx = bundle?.contextVersion ?? null;
  const explanation = explainForOperator(evaluation.recommendation, evaluation.unresolvedCauses, subject);
  const isUnresolved = evaluation.recommendation === "UNRESOLVED";

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
          <section className="gri-block">
            <h3 className="gri-block-title">What WW needs from you</h3>
            <p className="gri-question-text">{callAwayQuestion(subject, callAwayStrike ?? null)}</p>
            {/* HONEST BOUNDARY (no decorative control): capturing this answer as durable
                governance is not yet supported — see the Principal Decision Surface. WW does
                not render a clickable answer it cannot persist. */}
            <p className="gri-note">
              WW cannot record this answer yet — your present intent has no durable governed
              home in this slice, and the governing Wheel scope for {subject.symbol} is not
              established. This is a known boundary awaiting a governance-setup decision.
            </p>
          </section>
        )}

        {evidenceRows && evidenceRows.length > 0 && (
          <section className="gri-block">
            <h3 className="gri-block-title">Position / evidence</h3>
            <dl className="gri-rows">
              {evidenceRows.map((r, i) => (
                <div className="gri-row" key={i}><dt>{r.label}</dt><dd>{r.value}</dd></div>
              ))}
            </dl>
          </section>
        )}

        <section className="gri-block">
          <h3 className="gri-block-title">Governance / basis</h3>
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
