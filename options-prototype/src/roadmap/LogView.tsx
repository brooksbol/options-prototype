/**
 * Log lens — the chronology of explicit governed temporal events.
 *
 * Answers, for the Principal:
 *
 *   "What governed step happened, when, and to which identity?"
 *
 * This is a READ-ONLY PROJECTION of the canonical parking-lot sequence. Each row
 * is one canonical record — at any heading depth — that states its OWN explicit
 * **Date:**. It is NOT a Git log, a development activity feed, a duplicate
 * Project Journal, a manually maintained registry, or a progress dashboard.
 *
 * TRUTHFUL SEMANTICS:
 *   - The date shown is the EVENT date. It is NOT automatically an intake date.
 *   - Original-intake knowledge comes only from explicit intake evidence
 *     (`establishesIntake`), independent of `eventKind`. Identities with no such
 *     evidence are listed by name under "Intake date not recorded" — never
 *     inferred, backfilled, or established by a later event.
 *   - Event kind is derived only from what the authority explicitly states.
 *   - State is shown VERBATIM; a normalized badge appears only for an exact
 *     recognized leading token.
 *
 * PRESENTATION (operator acceptance):
 *   - Display order is NEWEST DATE FIRST. This is display-only; the projection's
 *     canonical order (ascending date, then true source order) is unchanged. For
 *     events sharing a date, canonical source order is preserved WITHIN the day
 *     (the day is not internally reversed).
 *   - Master/detail: the left pane lists events; the selected event's full detail
 *     shows in the right pane (the newest event is selected by default), mirroring
 *     the other Roadmap lenses' tree+detail pattern.
 *
 * The Project Journal remains the richer why-state chronology; this lens does not
 * claim a why-state link. `sourceFile` is provenance, not a why-state reference.
 */

import { useState } from "react";
import { getProjection } from "./use-roadmap-projection";
import type { LogEntry, LogEventKind } from "./roadmap-projection-types";

/** Human label + restrained color class for each explicit event kind. */
const KIND_META: Record<LogEventKind, { label: string; cls: string }> = {
  intake: { label: "Intake", cls: "rm-log-kind-intake" },
  reconciliation: { label: "Reconciliation", cls: "rm-log-kind-reconciliation" },
  refinement: { label: "Refinement", cls: "rm-log-kind-refinement" },
  implementation: { label: "Implementation", cls: "rm-log-kind-implementation" },
  remediation: { label: "Remediation / closure", cls: "rm-log-kind-remediation" },
  unclassified: { label: "Event", cls: "rm-log-kind-unclassified" },
};

/**
 * Apply a normalized state badge ONLY for an exact recognized leading token, so
 * we never misclassify phrases like "not closed". Anything else returns null and
 * the verbatim state text is shown on its own.
 */
function stateBadge(state: string | null): { label: string; cls: string } | null {
  if (!state) return null;
  const lead = state.trim().toUpperCase().match(/^[A-Z]+/)?.[0] ?? "";
  switch (lead) {
    case "INTAKE":
      return { label: "INTAKE", cls: "rm-log-state-intake" };
    case "RECONCILED":
      return { label: "RECONCILED", cls: "rm-log-state-reconciled" };
    case "IMPLEMENTED":
      return { label: "IMPLEMENTED", cls: "rm-log-state-closed" };
    case "REMEDIATED":
      return { label: "REMEDIATED", cls: "rm-log-state-closed" };
    case "DISCOVERY":
      return { label: "DISCOVERY", cls: "rm-log-state-discovery" };
    default:
      return null;
  }
}

/**
 * Newest-first DISPLAY order (display-only; projection order is unchanged).
 * Primary: event date descending. Secondary: canonical source order ASCENDING
 * within the same date, so a same-day group keeps its authored order (A, B, C)
 * and is NOT internally reversed just because dates run newest-first.
 */
function displayOrder(log: readonly LogEntry[]): LogEntry[] {
  return [...log].sort((a, b) => {
    if (a.eventDateIso !== b.eventDateIso) return a.eventDateIso < b.eventDateIso ? 1 : -1;
    return a.sourceOrder - b.sourceOrder;
  });
}

export function LogView() {
  const projection = getProjection();
  const { intakeDateUnknown } = projection;
  const { logTotal, logIntakeEvidenceEvents, plWithIntakeDate, plWithoutIntakeDate, plTotal } =
    projection.meta.counts;

  const ordered = displayOrder(projection.log);

  // Default selection: the first visible (newest) event. A stable per-render key
  // (sourceFile + sourceOrder) identifies the selection across the ordered list.
  const keyOf = (e: LogEntry) => `${e.sourceFile}:${e.sourceOrder}`;
  const [selectedKey, setSelectedKey] = useState<string | null>(
    ordered.length > 0 ? keyOf(ordered[0]) : null,
  );
  const selected = ordered.find((e) => keyOf(e) === selectedKey) ?? ordered[0] ?? null;

  return (
    <div className="rm-strategy rm-log">
      <div className="rm-tree-pane">
        <div className="rm-pl-note">
          Explicit governed temporal events — intake, reconciliation, refinement,
          implementation, remediation — from dated records in the canonical
          parking-lot sequence. Newest first. Explicit dates only; nothing is
          inferred. The date is the event date, not necessarily an intake date.
        </div>

        {ordered.length === 0 ? (
          <div className="rm-honest-empty">
            <div className="rm-honest-empty-title">No dated governed events recorded</div>
            <p>No parking-lot record currently states an explicit date. Nothing is inferred.</p>
          </div>
        ) : (
          <ol className="rm-log-list" role="listbox" aria-label="Governed temporal events (newest first)">
            {ordered.map((e) => {
              const k = keyOf(e);
              const kind = KIND_META[e.eventKind];
              const isSel = k === keyOf(selected as LogEntry);
              return (
                <li
                  key={k}
                  className={`rm-log-item rm-log-item-click${isSel ? " rm-row-selected" : ""}`}
                  role="option"
                  aria-selected={isSel}
                  tabIndex={0}
                  onClick={() => setSelectedKey(k)}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault();
                      setSelectedKey(k);
                    }
                  }}
                >
                  <div className="rm-log-date" title={e.eventDateText}>
                    <span className="rm-log-date-iso">{e.eventDateIso}</span>
                  </div>
                  <div className="rm-log-body">
                    <div className="rm-log-head">
                      <span className={`rm-log-kind ${kind.cls}`}>{kind.label}</span>
                      {e.establishesIntake && (
                        <span className="rm-log-intake-flag" title="Explicitly establishes original intake (independent of kind)">
                          establishes intake
                        </span>
                      )}
                      <span className="rm-log-title">{e.title}</span>
                      {e.plId ? (
                        <span className="rm-node-id">{e.plId}</span>
                      ) : (
                        <span className="rm-log-no-id">no PL-id</span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        <div className="rm-log-summary">
          {logTotal} governed events; {logIntakeEvidenceEvents} carry explicit intake
          evidence. {plWithIntakeDate} of {plTotal} parking-lot identities have an
          explicitly recorded original intake date.
        </div>

        {/* Intake date not recorded — named identities, never an inferred date. */}
        <div className="rm-log-gap">
          <div className="rm-log-gap-head">
            <span className="rm-log-gap-key">Intake date not recorded</span>
            <span className="rm-log-gap-count">
              {plWithoutIntakeDate} of {plTotal} parking-lot identities
            </span>
          </div>
          <p>
            These active parking-lot identities have no record that explicitly establishes
            an original intake date (no <code>(intake)</code> date marker and no
            "canonical identity created" statement), so their original intake date is
            unknown. Event classification does not establish intake, and a later
            reconciliation, refinement, or implementation event does not establish it
            either. It is intentionally not backfilled or inferred.
          </p>
          {intakeDateUnknown.length > 0 && (
            <ul className="rm-log-unknown-ids">
              {intakeDateUnknown.map((id) => (
                <li key={id} className="rm-node-id rm-log-unknown-id">
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rm-detail-pane">
        <LogDetail entry={selected} />
      </div>
    </div>
  );
}

function LogDetail({ entry }: { entry: LogEntry | null }) {
  if (!entry) {
    return (
      <div className="rm-detail rm-detail-empty">
        Select a governed temporal event to see its date, kind, identity, verbatim
        state, whether it establishes intake, and its source.
      </div>
    );
  }
  const kind = KIND_META[entry.eventKind];
  const badge = stateBadge(entry.state);
  return (
    <div className="rm-detail">
      <div className="rm-detail-head">
        <span className={`rm-log-kind ${kind.cls}`}>{kind.label}</span>
        {entry.establishesIntake && (
          <span className="rm-log-intake-flag" title="Explicitly establishes original intake (independent of kind)">
            establishes intake
          </span>
        )}
        <h2 className="rm-detail-name">{entry.title}</h2>
        <div className="rm-detail-ids">
          {entry.plId ? (
            <span className="rm-node-id">{entry.plId}</span>
          ) : (
            <span className="rm-log-no-id">no PL-id (this record names no PL-* identity)</span>
          )}
        </div>
      </div>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Event date</h3>
        <p className="rm-detail-desc">{entry.eventDateText}</p>
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Event kind</h3>
        <p className="rm-detail-desc">
          {kind.label} — presentation classification only; it does not by itself establish intake.
        </p>
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Original intake</h3>
        <p className="rm-detail-desc">
          {entry.establishesIntake
            ? "This record explicitly establishes the identity's original intake date."
            : "This record does not establish an original intake date."}
        </p>
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Governed state</h3>
        {entry.state ? (
          <p className="rm-detail-desc rm-log-statetext">
            {badge && <span className={`rm-log-state ${badge.cls}`}>{badge.label}</span>}
            <span className="rm-log-state-verbatim">{entry.state}</span>
          </p>
        ) : (
          <p className="rm-none">No explicit state recorded in this canonical record.</p>
        )}
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Source</h3>
        <p className="rm-detail-desc rm-detail-source">{entry.sourceFile}</p>
      </section>
    </div>
  );
}
