/**
 * Episode Ledger — PL-PROD-EVENTS V2
 *
 * Dense, chronological, operator-facing ledger of Wheelwright economic episodes.
 *
 * Design principles:
 *   - Fidelity Options Summary density reference: high information-per-pixel
 *   - One collapsed row tells the quick-read economic story
 *   - Strict chronological order (newest first)
 *   - Progressive disclosure via + button for provenance/detail
 *   - No cards, no generous padding, no dashboard whitespace
 *   - Hierarchy through typography/weight, not spacing
 *   - Readable at 100% zoom on desktop
 */

import { useState, useMemo, Fragment } from "react";
import { deriveEpisodeChapters, type EpisodeChapter, type EpisodeDerivationInput } from "./episode-derivation";
import type { ActivityRow } from "../csv/fidelity/activityParser";
import type { PortfolioSnapshot } from "../write-desk/types";
import type { ProductionAssessmentResponse } from "./production-types";

interface Props {
  activityRows: ActivityRow[] | null;
  snapshot: PortfolioSnapshot | null;
  assessment: ProductionAssessmentResponse | null;
  targetMonth: string;
}

export function EpisodeLedger({ activityRows, snapshot, assessment, targetMonth }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const chapters = useMemo(() => {
    if (!activityRows || activityRows.length === 0) return [];
    const input: EpisodeDerivationInput = {
      activityRows,
      snapshot,
      assessedTransactions: assessment?.transactions ?? null,
      targetMonth,
    };
    return deriveEpisodeChapters(input);
  }, [activityRows, snapshot, assessment, targetMonth]);

  if (chapters.length === 0) return null;

  // Group by date for date headers
  const dateGroups: { date: string; label: string; chapters: EpisodeChapter[] }[] = [];
  let currentDate = "";
  for (const ch of chapters) {
    if (ch.date !== currentDate) {
      currentDate = ch.date;
      dateGroups.push({ date: ch.date, label: formatDateLabel(ch.date), chapters: [] });
    }
    dateGroups[dateGroups.length - 1].chapters.push(ch);
  }

  return (
    <section className="ep-ledger" aria-label="Episode Ledger">
      <h3 className="prod-section-title">Economic Activity</h3>
      <table className="ep-table">
        <thead>
          <tr>
            <th className="ep-col-date">Date</th>
            <th className="ep-col-prim">Primitive</th>
            <th className="ep-col-what">What happened</th>
            <th className="ep-col-prod">Production / Result</th>
            <th className="ep-col-cap">Capital</th>
            <th className="ep-col-link">Next / Link</th>
            <th className="ep-col-disc"></th>
          </tr>
        </thead>
        <tbody>
          {dateGroups.map((group) => (
            <Fragment key={group.date}>
              {group.chapters.map((ch) => (
                <Fragment key={ch.episodeId + ch.date + ch.whatHappened}>
                  <tr
                    className={`ep-row ep-row-${ch.state}${expandedId === (ch.episodeId + ch.date) ? " ep-row-expanded" : ""}`}
                    onClick={() => setExpandedId(
                      expandedId === (ch.episodeId + ch.date) ? null : (ch.episodeId + ch.date)
                    )}
                  >
                    <td className="ep-cell-date">{formatShortDate(ch.date)}</td>
                    <td className="ep-cell-prim">
                      <span className={`ep-prim ep-prim-${ch.primitive.toLowerCase()}`}>
                        {ch.primitive}
                      </span>
                      {" "}
                      <span className="ep-underlying">{ch.underlying}</span>
                    </td>
                    <td className="ep-cell-what">{ch.whatHappened}</td>
                    <td className={`ep-cell-prod${ch.productionAmount != null && ch.productionAmount < 0 ? " ep-neg" : ""}`}>
                      {ch.productionLabel ?? "\u2014"}
                    </td>
                    <td className="ep-cell-cap">
                      {ch.capitalLabel ?? "\u2014"}
                    </td>
                    <td className="ep-cell-link">
                      {ch.linkDate ? (
                        <span className="ep-link">
                          {ch.linkDirection === "resolves" ? "\u2192 " : ""}
                          {ch.linkDirection === "opened" ? "opened " : ""}
                          {formatShortDate(ch.linkDate)}
                        </span>
                      ) : "\u2014"}
                    </td>
                    <td className="ep-cell-disc">
                      <span className="ep-disc-btn" aria-label="Toggle detail">+</span>
                    </td>
                  </tr>

                  {/* Expanded detail */}
                  {expandedId === (ch.episodeId + ch.date) && (
                    <tr className="ep-detail-row">
                      <td colSpan={7}>
                        <div className="ep-detail">
                          <div className="ep-detail-line">
                            <span className="ep-detail-key">Contract</span>
                            <span className="ep-detail-val">{ch.underlying} ${ch.strike} {ch.primitive === "CSP" || (ch.primitive === "PUT" as string) ? "Put" : "Call"} × {ch.contracts}</span>
                          </div>
                          <div className="ep-detail-line">
                            <span className="ep-detail-key">Symbol</span>
                            <span className="ep-detail-val">{ch.rawSymbol}</span>
                          </div>
                          {ch.conditionalLabel && (
                            <div className="ep-detail-line">
                              <span className="ep-detail-key">Conditional</span>
                              <span className="ep-detail-val">{ch.conditionalLabel}</span>
                            </div>
                          )}
                          {ch.constituentEvents.length > 0 && (
                            <div className="ep-detail-line">
                              <span className="ep-detail-key">Transactions</span>
                              <span className="ep-detail-val">
                                {ch.constituentEvents.map((e, i) => (
                                  <span key={i} className="ep-detail-tx">
                                    {e.date} · {e.action}{e.amount != null ? ` · $${Math.abs(e.amount).toFixed(2)}` : ""}
                                  </span>
                                ))}
                              </span>
                            </div>
                          )}
                          {ch.confidence !== "deterministic" && (
                            <div className="ep-detail-line">
                              <span className="ep-detail-key">Confidence</span>
                              <span className="ep-detail-val">{ch.confidence}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </section>
  );
}

// --- Date formatting ---

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}

function formatShortDate(dateStr: string): string {
  // "2026-08-21" → "Aug 21"
  const [, month, day] = dateStr.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;
}
