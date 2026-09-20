/**
 * Domain view — Wheelwright's maintained reference model of the external domain
 * it reasons about (currently the options domain).
 *
 * This lens PROJECTS the canonical options domain reference
 * (docs/foundations/options-domain-reference.md, Category E). It renders
 * documentation; it never synthesizes a second interpretation. Every string
 * shown is canonical heading/content verbatim or a mechanically-sliced excerpt,
 * plus the grounding tags the source itself carries.
 *
 * Boundary: describes the domain; does not establish Wheelwright policy or
 * authorize trading behavior. Read-only projection, collapsed by default,
 * consistent with the other lenses.
 */

import { useState } from "react";
import type { DomainEntry } from "./roadmap-projection-types";
import { getProjection } from "./use-roadmap-projection";

const SOURCE = "docs/foundations/options-domain-reference.md";

/** Strip only markdown emphasis markers for display; never alters wording. */
function displayHeading(h: string): string {
  return h.replace(/\*\*/g, "").replace(/\*/g, "").trim();
}

/** Render canonical content as plain preformatted-ish text; markers left intact. */
function renderContent(content: string): string {
  return content;
}

/** Display a table cell: strip only markdown emphasis; wording and tags intact. */
function displayCell(cell: string): string {
  return cell.replace(/\*\*/g, "").replace(/`/g, "").trim();
}

export function DomainView() {
  const { domain } = getProjection();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Build a stable key per entry: partIndex:entryIndex.
  const selected: { entry: DomainEntry } | null = (() => {
    if (!selectedKey) return null;
    const [pi, ei] = selectedKey.split(":").map((n) => parseInt(n, 10));
    const entry = domain.parts[pi]?.entries[ei];
    return entry ? { entry } : null;
  })();

  if (domain.parts.length === 0) {
    return (
      <div className="rm-single">
        <div className="rm-honest-empty">
          <div className="rm-honest-empty-title">No domain reference is currently projected.</div>
          <p>
            Domain knowledge appears here only when present in <code>{SOURCE}</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-strategy">
      <div className="rm-tree-pane">
        <div className="rm-pl-note rm-domain-boundary">
          Domain reference — describes the domain; does not establish Wheelwright policy
          or authorize trading behavior. Projected read-only from <code>{SOURCE}</code>.
        </div>

        <div className="rm-tree">
          {domain.parts.map((part, pi) => {
            const isOpen = expanded.has(part.title);
            return (
              <div key={part.title} className="rm-tree-node">
                <div
                  className="rm-row rm-row-group"
                  onClick={() => toggle(part.title)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(part.title);
                    }
                  }}
                >
                  <button
                    className="rm-twisty"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(part.title);
                    }}
                  >
                    {isOpen ? "▾" : "▸"}
                  </button>
                  <span className="rm-pl-group-name">{part.title}</span>
                  <span className="rm-pl-group-count">{part.entries.length}</span>
                </div>
                {isOpen && (
                  <div className="rm-tree-children">
                    {part.entries.map((entry, ei) => {
                      const key = `${pi}:${ei}`;
                      return (
                        <div
                          key={key}
                          className={`rm-row rm-row-pl${selectedKey === key ? " rm-row-selected" : ""}`}
                          style={{ paddingLeft: "30px" }}
                          onClick={() => setSelectedKey(key)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedKey(key);
                            }
                          }}
                        >
                          <span className="rm-node-name">{displayHeading(entry.heading)}</span>
                          {entry.tags.map((t) => (
                            <span key={t} className="rm-domain-tag">{t}</span>
                          ))}
                        </div>
                      );
                    })}
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
              <span className="rm-type-tag rm-type-domain-tag">Domain</span>
              <h2 className="rm-detail-name">{displayHeading(selected.entry.heading)}</h2>
              {selected.entry.tags.length > 0 && (
                <div className="rm-detail-ids">
                  {selected.entry.tags.map((t) => (
                    <span key={t} className="rm-domain-tag">{t}</span>
                  ))}
                </div>
              )}
            </div>
            {selected.entry.content && (
              <pre className="rm-domain-content">{renderContent(selected.entry.content)}</pre>
            )}
            {selected.entry.tables.map((table, ti) => (
              <div key={ti} className="rm-domain-table-wrap">
                <table className="rm-domain-table">
                  <thead>
                    <tr>
                      {table.header.map((h, hi) => (
                        <th key={hi}>{displayCell(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((c, ci) => (
                          <td key={ci}>{displayCell(c)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {selected.entry.truncated && (
              <p className="rm-none">
                Additional canonical detail exists in <code>{SOURCE}</code>.
              </p>
            )}
          </div>
        ) : (
          <div className="rm-detail rm-detail-empty">
            Select a domain entry to see its canonical description and grounding tags.
          </div>
        )}
      </div>
    </div>
  );
}
