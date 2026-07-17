/**
 * Distribution Line + One-Line Key
 *
 * Renders the entire ETF universe as one continuous segmented color bar
 * with exactly one legend line below. Each ETF belongs to one terminal outcome.
 * All segments sum to the monitored universe.
 *
 * Semantic colors (spec-defined):
 *   #42C77A  Actionable
 *   #4EA1FF  Edge
 *   #D6A83B  Wait
 *   #E45C5C  Hard No
 *   #9A78D1  No Delta Match
 *   #4CB7A5  No DTE Match
 *   #687386  No Options
 *   #8993A4  Incomplete
 */

import type { RecommendationFunnel, TerminalOutcomes } from "../write-desk/recommend";

interface Props {
  funnel: RecommendationFunnel;
  backendResolved?: number;
}

const SEGMENTS: { key: keyof TerminalOutcomes; label: string; color: string }[] = [
  { key: "actionable", label: "Actionable", color: "#42C77A" },
  { key: "edge", label: "EDGE", color: "#4EA1FF" },
  { key: "wait", label: "Wait", color: "#D6A83B" },
  { key: "hardNo", label: "Hard No", color: "#E45C5C" },
  { key: "noDeltaMatch", label: "No Delta Match", color: "#9A78D1" },
  { key: "noDteMatch", label: "No DTE Match", color: "#4CB7A5" },
  { key: "nonOptionable", label: "No Options", color: "#687386" },
  { key: "incomplete", label: "Incomplete", color: "#8993A4" },
];

export function FunnelInfographic({ funnel, backendResolved }: Props) {
  const { monitored, outcomes } = funnel;
  const isAcquiring = outcomes.incomplete > 0;
  const isMixed = backendResolved != null && backendResolved < funnel.resolved && isAcquiring;

  return (
    <div className="wd-dist">
      {/* Continuous segmented color line */}
      <div className="wd-dist-row">
        <div className="wd-dist-bar">
          {SEGMENTS.map(seg => {
            const count = outcomes[seg.key];
            if (count === 0) return null;
            return (
              <div
                key={seg.key}
                className="wd-dist-seg"
                style={{ width: `${(count / monitored) * 100}%`, backgroundColor: seg.color }}
                title={`${count} ${seg.label}`}
              />
            );
          })}
        </div>
        <span className="wd-dist-total">{monitored} ETFs</span>
      </div>

      {/* One-line key */}
      <div className="wd-dist-key">
        {SEGMENTS.map(seg => {
          const count = outcomes[seg.key];
          if (count === 0) return null;
          return (
            <span key={seg.key} className="wd-dist-item" title={`${count} of ${monitored} (${((count / monitored) * 100).toFixed(0)}%)`}>
              <span className="wd-dist-dot" style={{ backgroundColor: seg.color }} />
              <span className="wd-dist-count" style={{ color: seg.color }}>{count}</span>
              <span className="wd-dist-label">{seg.label}</span>
            </span>
          );
        })}
        {isMixed && <span className="wd-dist-mixed">Prior + {backendResolved} current</span>}
      </div>
    </div>
  );
}
