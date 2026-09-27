/**
 * GovernedRecommendationInspector — the SINGLE right-side governed Recommendation drawer.
 *
 * ADR-021: dense, flat, operator-first, and driven by the COMPLETE predicate picture.
 *   - Recommendation tag + subject summary + one-line headline (or outside-program).
 *   - Predicate picture: every relevant predicate with its truthful operator-language
 *     status (Established / No / Not established / Evidence insufficient / Not yet evaluated
 *     (+ blocked-by) / No governed policy yet / Not applicable). No status is conflated.
 *   - Enabled controls appear ONLY where the admissibility gate says a complete durable
 *     chain exists. In this slice none do, so the drawer explains the blocker and offers no
 *     fake control (ADR-021 §4 / Doc 67 §6).
 *   - Position/evidence + governance/basis are inspection detail (human account name primary,
 *     plain rule name primary, machine ids demoted).
 *
 * No accordions. Presentation only; reads already-resolved values. No Doc 65 semantics change.
 */

import { useState } from "react";
import type { ResolvedGovernedRecommendation } from "../governed-decision/resolve";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import { explainForOperator, subjectSummary, ruleName } from "./governed-drawer-language";
import { admissibleControlFor } from "../governed-decision/control-admissibility";
import { attachProgram } from "../governed-decision/client";
import "./governed-recommendation-inspector.css";

/** The one ratified destination for ATTACH TO… in this slice (Doc 69). */
const ATTACH_DESTINATION_LABEL = "Assignment-Centric Wheel";

export interface DrawerFactRow {
  label: string;
  value: string;
}

export function GovernedRecommendationInspector({
  resolved,
  onClose,
  /** Human-readable account name (primary account identity). Falls back to the raw id. */
  accountName,
  /** Real observed position/evidence facts for the POSITION / EVIDENCE block. */
  evidenceRows,
  /**
   * Called after a durable governance change (e.g. a successful ATTACH TO…) so the Console
   * can trigger deterministic reevaluation. Optional; when absent, the control is not offered.
   */
  onGovernanceChanged,
}: {
  resolved: ResolvedGovernedRecommendation;
  onClose: () => void;
  brokerageAccountId?: string | null;
  accountName?: string | null;
  callAwayStrike?: number | null;
  evidenceRows?: DrawerFactRow[];
  onGovernanceChanged?: () => void;
}) {
  const { subject, evaluation, bundle } = resolved;
  const ctx = bundle?.contextVersion ?? null;
  const explanation = explainForOperator(evaluation, subject);
  const isUnresolved = evaluation.recommendation === "UNRESOLVED" && !explanation.outsideProgram;

  // The membership predicate whose admissible capability is the ATTACH TO… affordance, if any.
  const attachPredicate = evaluation.predicateResults.find(
    (p) => p.key === "wheel-membership" && admissibleControlFor(p) === "attach-assignment-centric-wheel",
  );
  const canAttach = attachPredicate != null && onGovernanceChanged != null;

  // Whether ANY predicate has an admissible enabled control OTHER than the attach control
  // handled explicitly below (reserved for future capabilities). The attach control only
  // renders when it is both admissible AND wired (canAttach); otherwise the honest blocker
  // explanation is shown.
  const anyOtherAdmissibleControl = evaluation.predicateResults.some(
    (p) => {
      const cap = admissibleControlFor(p);
      return cap != null && cap !== "attach-assignment-centric-wheel";
    },
  );

  const [attachState, setAttachState] = useState<"idle" | "confirming" | "attaching" | "error">("idle");
  const [attachError, setAttachError] = useState<string | null>(null);

  async function doAttach() {
    setAttachState("attaching");
    setAttachError(null);
    const res = await attachProgram({
      brokerageAccountId: subject.brokerageAccountId,
      subjectId: subject.subjectId,
      subjectType: subject.subjectType,
    });
    if (res.ok) {
      // Durable membership recorded. Ask the Console to reevaluate; the drawer will
      // re-open with the new predicate picture (membership established).
      onGovernanceChanged?.();
      onClose();
    } else {
      setAttachState("error");
      setAttachError(res.error ?? "Attach failed.");
    }
  }

  return (
    <div className="gri-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="gri-panel" onClick={(e) => e.stopPropagation()}>
        <header className="gri-header">
          <span className="gri-title">Governed Recommendation</span>
          <button className="gri-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="gri-top">
          {explanation.outsideProgram ? (
            <span className="grc-tag grc-tag-outside">OUTSIDE PROGRAM</span>
          ) : (
            <span className={`grc-tag grc-tag-${evaluation.recommendation.toLowerCase().replace("_", "-")}`}>
              {RECOMMENDATION_LABEL[evaluation.recommendation]}
            </span>
          )}
          <span className="gri-subject">{subjectSummary(subject)}</span>
        </div>

        <p className="gri-headline">{explanation.headline}</p>

        {/* Complete ADR-021 predicate picture (always shown). */}
        <section className="gri-block">
          <h3 className="gri-block-title">Governed checklist</h3>
          <dl className="gri-rows">
            {explanation.rows.map((r) => (
              <div className={`gri-row gri-pred gri-pred-${r.status.toLowerCase()}`} key={r.key} title={r.reason}>
                <dt>{r.label}</dt>
                <dd>
                  {r.statusLabel}
                  {r.status === "NOT_EVALUATED" && r.blockedBy && r.blockedBy.length > 0 && (
                    <span className="gri-blockedby"> (needs {r.blockedBy.join(", ")})</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Action / blocker section. No enabled control exists in this slice; explain honestly. */}
        {isUnresolved && (
          <section className="gri-block">
            <h3 className="gri-block-title">What WW needs</h3>
            {canAttach ? (
              <div className="gri-attach">
                <p className="gri-note">
                  {explanation.whyUnresolved} You can tell WW this position is managed under the
                  Assignment-Centric Wheel. That records only that it takes part in the Wheel
                  program; it does not set your call-away preference or answer any missing policy,
                  so the recommendation may stay unresolved until those are addressed.
                </p>
                {attachState === "confirming" ? (
                  <div className="gri-attach-confirm">
                    <p className="gri-note">
                      Manage <strong>{subjectSummary(subject)}</strong> under{" "}
                      <strong>{ATTACH_DESTINATION_LABEL}</strong>?
                    </p>
                    <div className="gri-attach-actions">
                      <button
                        className="gri-attach-btn gri-attach-confirm-btn"
                        onClick={doAttach}
                      >
                        Confirm
                      </button>
                      <button
                        className="gri-attach-btn gri-attach-cancel-btn"
                        onClick={() => setAttachState("idle")}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : attachState === "attaching" ? (
                  <p className="gri-note">Recording membership…</p>
                ) : (
                  <>
                    <button
                      className="gri-attach-btn"
                      onClick={() => setAttachState("confirming")}
                    >
                      Attach to…
                    </button>
                    {attachState === "error" && attachError && (
                      <p className="gri-note gri-attach-error">{attachError}</p>
                    )}
                  </>
                )}
              </div>
            ) : anyOtherAdmissibleControl ? (
              // (Reserved) Other admissible capabilities render here as they are added.
              <p className="gri-note">An operator action is available for this subject.</p>
            ) : (
              <p className="gri-note">
                {explanation.whyUnresolved} WW cannot offer an action here yet: establishing the
                missing governance requires a governed-setup path (and, where a policy is
                undefined, new ratified policy) that is not yet available in this slice.
              </p>
            )}
          </section>
        )}

        {explanation.outsideProgram && (
          <section className="gri-block">
            <h3 className="gri-block-title">Why no recommendation</h3>
            <p className="gri-note">
              This position is authoritatively recorded as outside the Wheel program, so the
              Wheel rule does not apply. This is a known negative, not an unresolved question.
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
            <div className="gri-row"><dt>Account</dt><dd>{accountName || subject.brokerageAccountId}</dd></div>
            <div className="gri-row"><dt>Subject</dt><dd>{subjectSummary(subject)}</dd></div>
            <div className="gri-row"><dt>Rule</dt><dd>{ruleName(evaluation.ruleId)}</dd></div>
            <div className="gri-row"><dt>Program</dt><dd>{ctx ? ctx.program.program : "—"}</dd></div>
            <div className="gri-row gri-row-detail"><dt>Rule id</dt><dd><code>{evaluation.ruleId}</code></dd></div>
            {ctx && <div className="gri-row gri-row-detail"><dt>Context</dt><dd><code>{ctx.contextVersionId}</code> (v{ctx.version})</dd></div>}
            <div className="gri-row gri-row-detail"><dt>Account id</dt><dd><code>{subject.brokerageAccountId}</code></dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}
