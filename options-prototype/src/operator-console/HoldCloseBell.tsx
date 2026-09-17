/**
 * HoldCloseBell — the row-level BTS attention indicator.
 *
 * Presentation only. The state is derived upstream (useHoldCloseNotices) from
 * the GOVERNED DECISION for the position; this component makes no decision.
 *
 * Semantics (Principal-ratified):
 *   - "actionable" → RED BTS attention indicator. Wheelwright has a governed
 *     lifecycle action for this position that requires operator attention (e.g.
 *     BTC, or an explicit RECONCILE-LIFECYCLE). It does NOT mean automatic
 *     execution, certainty about fill price, that every consequence fact is
 *     available, or that current option-chain pricing is admissible. A pricing/
 *     evidence limitation may change supporting detail without erasing the
 *     governed action (invariant BTS-CLOSURE-INDEPENDENCE).
 *   - "none"       → no governed action warranted now; no indicator.
 */

import type { HoldCloseNotice } from "./use-hold-close-notices";
import "./hold-close-bell.css";

export function HoldCloseBell({ notice }: { notice: HoldCloseNotice }) {
  if (notice === "none") return null;

  const label = "Governed lifecycle action needs attention — open for the recommended action";

  return (
    <span
      className="hcb hcb-actionable"
      role="img"
      aria-label={label}
      title={label}
      data-notice={notice}
    >
      <span className="hcb-dot" aria-hidden="true">🔴</span>
    </span>
  );
}
