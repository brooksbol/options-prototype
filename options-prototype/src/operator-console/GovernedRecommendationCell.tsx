/**
 * GovernedRecommendationCell — compact TAG projection of a bounded governed Recommendation
 * (Doc 65), in the same dense Console tag idiom as the CALL / BW type tags.
 *
 * Principal UX (corrective pass): the Recommendation value is a compact tag/badge — visually
 * analogous to the `CALL` / `BW` type tags — NOT plain unstyled text, NOT a hyperlink, and
 * NOT accompanied by a separate status dot. It lives in the dedicated Recommendation column
 * (never in the TYPE cell). The clickable `<td>` (oc-td-governed / oc-inv-td-governed) is the
 * interaction target (with stopPropagation) and opens the right-side governed drawer.
 *
 * Presentation only. The recommendation is computed upstream (governed-decision evaluators)
 * from authorized governance + authoritative evidence; this component makes no decision and
 * never derives governance.
 *
 * Vocabulary (bounded): LET RESOLVE | SELL CALL | UNRESOLVED. NOT a universal enum; never
 * collapsed into HOLD/WAIT or a contract selection.
 */

import type { GovernedRecommendation } from "../governed-decision/types";
import { RECOMMENDATION_LABEL } from "../governed-decision/types";
import "./governed-recommendation-cell.css";

const CLASS: Record<GovernedRecommendation, string> = {
  LET_RESOLVE: "grc-tag grc-tag-let-resolve",
  SELL_CALL: "grc-tag grc-tag-sell-call",
  UNRESOLVED: "grc-tag grc-tag-unresolved",
};

/**
 * A compact Recommendation tag for a table cell. The clickable `<td>` (owned by the table)
 * carries the click + stopPropagation so the whole cell is the interaction target.
 */
export function GovernedRecommendationCell({
  recommendation,
}: {
  recommendation: GovernedRecommendation;
}) {
  const label = RECOMMENDATION_LABEL[recommendation];
  const title =
    recommendation === "UNRESOLVED"
      ? "Governed recommendation unresolved — click to open the governed drawer and see what's needed."
      : `Governed recommendation: ${label}. Click to open the governed drawer.`;
  return (
    <span className={CLASS[recommendation]} data-recommendation={recommendation} title={title}>
      {label}
    </span>
  );
}
