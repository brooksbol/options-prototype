/**
 * GovernedRecommendationCell — plain-text projection of a bounded governed Recommendation
 * (Doc 65) rendered as ordinary, dense table data.
 *
 * Principal UX (drawer consolidation): the Recommendation value is PLAIN TEXT — no pill,
 * no tag, no badge, no hyperlink styling, no status dot. The whole cell is the interaction
 * target; clicking it opens the single governed Recommendation drawer. Interactivity is
 * communicated only by the cell's hover/cursor convention, kept subtle and dense.
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

/**
 * Inner content for a Recommendation table cell: plain text plus a data attribute for the
 * recommendation state. The clickable `<td>` (with stopPropagation) is owned by the table
 * so the entire cell is the interaction target and row clicks are not triggered.
 */
export function GovernedRecommendationCell({
  recommendation,
}: {
  recommendation: GovernedRecommendation;
}) {
  const label = RECOMMENDATION_LABEL[recommendation];
  const title =
    recommendation === "UNRESOLVED"
      ? "Governed recommendation unresolved — insufficient governance or evidence. Click to inspect and govern."
      : `Governed recommendation: ${label}. Click to inspect the governing basis.`;
  return (
    <span className="grc" data-recommendation={recommendation} title={title}>
      {label}
    </span>
  );
}
