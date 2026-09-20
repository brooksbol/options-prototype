/**
 * Priority view — the provisional working order of priority.
 *
 * Semantics: "our current working order of priority, subject to change." Not a
 * schedule, promise, or immutable ordering.
 *
 * Priority is authority-established ONLY (docs/roadmap-priority.md). It is never
 * inferred from parking-lot order, document order, activity, or status. When the
 * authority has not established a ranking, this view says so honestly rather than
 * showing a speculative order.
 */

import { getProjection, lvtIndex, arIndex } from "./use-roadmap-projection";

function labelForRef(
  refId: string | null,
  byLvt: ReturnType<typeof lvtIndex>,
  byAr: ReturnType<typeof arIndex>,
  projection: ReturnType<typeof getProjection>,
): string | null {
  if (!refId) return null;
  const lvt = byLvt.get(refId);
  if (lvt) return lvt.name;
  const ar = byAr.get(refId);
  if (ar) return ar.title;
  const pl = projection.parkingLot.find((i) => i.id === refId);
  if (pl) return pl.name;
  const adr = projection.adrs.find((a) => a.id === refId);
  if (adr) return adr.title;
  return null;
}

export function PriorityView() {
  const projection = getProjection();
  const byLvt = lvtIndex();
  const byAr = arIndex();
  const { priority } = projection;

  return (
    <div className="rm-single">
      <div className="rm-pl-note">
        Our current working order of priority, subject to change. Not a schedule, a
        delivery promise, or an immutable ordering. Established only by reconciliation —
        never inferred from parking-lot order, document order, activity, or status.
      </div>

      {!priority.established ? (
        <div className="rm-honest-empty">
          <div className="rm-honest-empty-title">No authoritative priority ranking established yet.</div>
          <p>
            The prioritization exercise has not been performed. When a working order is
            reconciled in <code>docs/roadmap-priority.md</code>, it will appear here.
          </p>
        </div>
      ) : (
        <ol className="rm-priority-list">
          {priority.entries.map((e) => {
            const label = labelForRef(e.refId, byLvt, byAr, projection);
            return (
              <li key={e.rank} className="rm-priority-item">
                <span className="rm-priority-rank">{e.rank}</span>
                <span className="rm-priority-body">
                  {label && <span className="rm-node-name">{label}</span>}
                  {e.refId && <span className="rm-node-id">{e.refId}</span>}
                  {e.reason && <span className="rm-priority-reason">{e.reason}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
