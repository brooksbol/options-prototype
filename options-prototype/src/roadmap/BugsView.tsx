/**
 * Bugs view — Wheelwright's maintained record of known incorrect/defective
 * behavior, independently of whether a defect is prioritized or authorized for
 * remediation.
 *
 * Projects the canonical bug index (docs/bugs/INDEX.md, the sole defect
 * system-of-record) verbatim. Grouped by canonical Status; within a group,
 * source (index) order is preserved — NEVER sorted by severity, area, age, or
 * inferred remediation value.
 *
 * Critical boundary (visible + structural): severity is evidence of consequence,
 * not remediation priority; presence here does not authorize remediation. This
 * lens does not link into repository documents — it displays the canonical record
 * path reference only. Read-only projection.
 */

import { useState } from "react";
import type { BugRecord } from "./roadmap-projection-types";
import { getProjection } from "./use-roadmap-projection";

const SOURCE = "docs/bugs/INDEX.md";

// Canonical status vocabulary, in a stable display order (grouping, not ranking).
const STATUS_ORDER = ["Open", "Resolved", "Won't Fix", "Duplicate"];

function statusRank(status: string): number {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? STATUS_ORDER.length : i;
}

export function BugsView() {
  const { bugs } = getProjection();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group by canonical Status, preserving index (source) order WITHIN each group.
  const groups: { status: string; items: BugRecord[] }[] = [];
  const idx = new Map<string, number>();
  for (const b of bugs) {
    let i = idx.get(b.status);
    if (i === undefined) {
      i = groups.length;
      idx.set(b.status, i);
      groups.push({ status: b.status, items: [] });
    }
    groups[i].items.push(b);
  }
  // Order the GROUPS by the canonical status order (not the bugs within them).
  groups.sort((a, b) => statusRank(a.status) - statusRank(b.status));

  const selected = selectedId ? bugs.find((b) => b.id === selectedId) ?? null : null;

  if (bugs.length === 0) {
    return (
      <div className="rm-single">
        <div className="rm-honest-empty">
          <div className="rm-honest-empty-title">No known defects are currently recorded.</div>
          <p>Defects appear here only when present in <code>{SOURCE}</code>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-strategy">
      <div className="rm-tree-pane">
        <div className="rm-pl-note rm-domain-boundary">
          Known defects, projected from <code>{SOURCE}</code>. Severity is evidence of
          consequence, not remediation priority; presence here does not authorize
          remediation. Order within a status is source order, not execution priority.
        </div>

        <div className="rm-tree">
          {groups.map((group) => {
            const isOpen = expanded.has(group.status);
            return (
              <div key={group.status} className="rm-tree-node">
                <div
                  className="rm-row rm-row-group"
                  onClick={() => toggle(group.status)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(group.status);
                    }
                  }}
                >
                  <button
                    className="rm-twisty"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(group.status);
                    }}
                  >
                    {isOpen ? "▾" : "▸"}
                  </button>
                  <span className="rm-pl-group-name">{group.status}</span>
                  <span className="rm-pl-group-count">{group.items.length}</span>
                </div>
                {isOpen && (
                  <div className="rm-tree-children">
                    {group.items.map((bug) => (
                      <div
                        key={bug.id}
                        className={`rm-row rm-row-pl${selectedId === bug.id ? " rm-row-selected" : ""}`}
                        style={{ paddingLeft: "30px" }}
                        onClick={() => setSelectedId(bug.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(bug.id);
                          }
                        }}
                      >
                        <span className="rm-node-id">{bug.id}</span>
                        <span className="rm-node-name">{bug.title}</span>
                        <span className={`rm-bug-sev rm-bug-sev-${severityClass(bug.severity)}`}>
                          {bug.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rm-detail-pane">
        {selected ? (
          <div className="rm-detail">
            <div className="rm-detail-head">
              <span className="rm-type-tag rm-type-bug-tag">Bug</span>
              <h2 className="rm-detail-name">{selected.recordTitle ?? selected.title}</h2>
              <div className="rm-detail-ids">
                <span className="rm-node-id">{selected.id}</span>
              </div>
            </div>

            {/* Registry metadata — supporting strip, not the whole detail. */}
            <div className="rm-bug-meta">
              <span className="rm-bug-meta-item">
                <span className="rm-bug-meta-key">Status</span> {selected.status}
              </span>
              <span className="rm-bug-meta-item">
                <span className="rm-bug-meta-key">Severity</span>{" "}
                <span className={`rm-bug-sev rm-bug-sev-inline rm-bug-sev-${severityClass(selected.severity)}`}>
                  {selected.severity}
                </span>
                <span className="rm-bug-sev-note"> · consequence, not priority</span>
              </span>
              <span className="rm-bug-meta-item">
                <span className="rm-bug-meta-key">Area</span> {selected.area}
              </span>
              <span className="rm-bug-meta-item">
                <span className="rm-bug-meta-key">Provenance</span> {selected.provenance}
              </span>
              <span className="rm-bug-meta-item">
                <span className="rm-bug-meta-key">Record</span>{" "}
                <span className="rm-detail-source">docs/bugs/{selected.recordFile}</span>
              </span>
            </div>

            {/* Canonical record sections — faithful projection, verbatim/excerpt. */}
            {selected.sections.map((section, si) => (
              <section key={si} className="rm-detail-section">
                <h3 className="rm-detail-section-title rm-bug-section-title">{section.heading}</h3>
                {section.content && (
                  <pre className="rm-domain-content">{section.content}</pre>
                )}
                {section.tables.map((table, ti) => (
                  <div key={ti} className="rm-domain-table-wrap">
                    <table className="rm-domain-table">
                      <thead>
                        <tr>{table.header.map((h, hi) => <th key={hi}>{displayCell(h)}</th>)}</tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, ri) => (
                          <tr key={ri}>{row.map((c, ci) => <td key={ci}>{displayCell(c)}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
                {section.truncated && (
                  <p className="rm-none">
                    Additional canonical detail exists in <code>docs/bugs/{selected.recordFile}</code>.
                  </p>
                )}
              </section>
            ))}
          </div>
        ) : (
          <div className="rm-detail rm-detail-empty">
            Select a defect to see its canonical record: what is wrong, the intended
            semantics, evidence, consequence, and disposition.
          </div>
        )}
      </div>
    </div>
  );
}

/** Display a table cell: strip only markdown emphasis; wording intact. */
function displayCell(cell: string): string {
  return cell.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

/** Map a severity value to a style class; unknown/"Not established" is neutral. */
function severityClass(severity: string): string {
  if (/^S1$/i.test(severity)) return "s1";
  if (/^S2$/i.test(severity)) return "s2";
  if (/^S3$/i.test(severity)) return "s3";
  if (/^S4$/i.test(severity)) return "s4";
  return "none";
}
