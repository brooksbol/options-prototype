/**
 * Coming Soon view — the product-horizon snapshot (Now / Next / Later).
 *
 * A lightweight snapshot of the Principal's current product focus. Three
 * horizons, each an UNORDERED set of user-meaningful capabilities. Horizon
 * placement expresses attention/intent, not commitment, and does not authorize
 * work. Item order within a horizon carries no meaning; Priority
 * (docs/roadmap-priority.md) is the sole ordinal execution authority.
 *
 * Read-only projection of docs/roadmap-coming-soon.md. No rank, dates,
 * percentages, status badges, or workflow controls — deliberately light.
 */

import type { ComingSoonItem } from "./roadmap-projection-types";
import { getProjection } from "./use-roadmap-projection";

const HORIZONS: { key: "now" | "next" | "later"; label: string; blurb: string }[] = [
  { key: "now", label: "Now", blurb: "In the near product horizon." },
  { key: "next", label: "Next", blurb: "Expected after nearer work matures." },
  { key: "later", label: "Later", blurb: "Believed to belong in Wheelwright's future." },
];

function HorizonSection({
  label,
  blurb,
  items,
}: {
  label: string;
  blurb: string;
  items: ComingSoonItem[];
}) {
  return (
    <section className="rm-cs-horizon">
      <div className="rm-cs-horizon-head">
        <h3 className="rm-cs-horizon-label">{label}</h3>
        <span className="rm-cs-horizon-blurb">{blurb}</span>
      </div>
      {items.length === 0 ? (
        <p className="rm-none">Nothing in this horizon.</p>
      ) : (
        <ul className="rm-cs-list">
          {items.map((item) => (
            <li key={item.name} className="rm-cs-item">
              <span className="rm-cs-name">{item.name}</span>
              {item.description && <span className="rm-cs-desc">{item.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ComingSoonView() {
  const { comingSoon } = getProjection();
  const empty =
    comingSoon.now.length === 0 &&
    comingSoon.next.length === 0 &&
    comingSoon.later.length === 0;

  return (
    <div className="rm-single">
      <div className="rm-pl-note">
        A snapshot of the current product horizon — not a plan, schedule, or commitment.
        Horizons are unordered; placement reflects current attention and intent. Work
        begins only through the normal work-authorization process. For execution order,
        see Priority.
      </div>

      {empty ? (
        <div className="rm-honest-empty">
          <div className="rm-honest-empty-title">No capabilities are currently on the product horizon.</div>
          <p>
            Capabilities appear here only when curated in <code>docs/roadmap-coming-soon.md</code>.
          </p>
        </div>
      ) : (
        <div className="rm-cs-horizons">
          {HORIZONS.map((h) => (
            <HorizonSection
              key={h.key}
              label={h.label}
              blurb={h.blurb}
              items={comingSoon[h.key]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
