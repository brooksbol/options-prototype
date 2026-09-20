/**
 * Coming Soon view — curated, user-facing future capabilities.
 *
 * Answers "what future product capabilities are we willing to communicate to
 * users?" Distinct from Priority. Items are curated by explicit decision in
 * docs/roadmap-coming-soon.md — never auto-included because something is high
 * priority, in the parking lot, in the LVT, or has an ADR. No delivery dates.
 *
 * When nothing is curated, this view says so honestly.
 */

import { getProjection } from "./use-roadmap-projection";

export function ComingSoonView() {
  const { comingSoon } = getProjection();

  return (
    <div className="rm-single">
      <div className="rm-pl-note">
        Future product capabilities Wheelwright is willing to communicate to users.
        Deliberately curated — not auto-populated from priority, parking lot, LVT, or
        ADRs. No delivery dates.
      </div>

      {!comingSoon.curated ? (
        <div className="rm-honest-empty">
          <div className="rm-honest-empty-title">Nothing is currently announced as coming soon.</div>
          <p>
            Capabilities appear here only when curated for user communication in{" "}
            <code>docs/roadmap-coming-soon.md</code>.
          </p>
        </div>
      ) : (
        <ul className="rm-cs-list">
          {comingSoon.items.map((item) => (
            <li key={item.name} className="rm-cs-item">
              <span className="rm-cs-name">{item.name}</span>
              {item.status && <span className="rm-cs-status">{item.status}</span>}
              {item.description && <span className="rm-cs-desc">{item.description}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
