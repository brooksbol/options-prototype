/**
 * GovernedRecommendationTag — compact Console projection of a bounded governed
 * Recommendation (Doc 65).
 *
 * Presentation only. The recommendation is computed upstream (governed-decision
 * evaluators) from authorized governance + authoritative evidence; this component makes
 * no decision and never derives governance.
 *
 * Vocabulary (bounded): LET RESOLVE | SELL CALL | UNRESOLVED. This is NOT a universal
 * Recommendation enum and must not be collapsed into HOLD/WAIT or a contract selection.
 */

import type { GovernedRecommendation } from "../governed-decision/types";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import "./governed-recommendation-tag.css";

export function GovernedRecommendationTag({
  recommendation,
  onClick,
}: {
  recommendation: GovernedRecommendation;
  onClick?: () => void;
}) {
  const label = RECOMMENDATION_LABEL[recommendation];
  const cls =
    recommendation === "LET_RESOLVE"
      ? "grt grt-let-resolve"
      : recommendation === "SELL_CALL"
        ? "grt grt-sell-call"
        : "grt grt-unresolved";
  const title =
    recommendation === "UNRESOLVED"
      ? "Governed recommendation unresolved — insufficient governance or evidence. Open to inspect why."
      : `By-the-book governed recommendation: ${label}. Open to inspect the governing basis.`;
  return (
    <button
      type="button"
      className={cls}
      title={title}
      aria-label={title}
      onClick={onClick}
      data-recommendation={recommendation}
    >
      {label}
    </button>
  );
}
