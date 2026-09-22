/**
 * Parking-lot view — unresolved work and ideas (PL-* items), plus the resolved
 * landscape (graduated / closed).
 *
 * Layout mirrors the Strategy lens: a tree pane on the left (section groups →
 * item rows, with a separate "Resolved landscape" group) and a details pane on
 * the right showing the selected item's authoritative facts.
 *
 * Items are grouped by the repository-supported section/disposition they were
 * found under. Order within a group follows the source file only; it carries NO
 * priority. Explicit LVT/AR relationships are shown only where the authority
 * states them — never manufactured.
 */

import { useState } from "react";
import { getProjection, lvtIndex } from "./use-roadmap-projection";
import type { PlItem, GraduatedItem } from "./roadmap-projection-types";

interface ParkingLotViewProps {
  onSelectLvt: (id: string) => void;
}

type Selection =
  | { kind: "active"; item: PlItem }
  | { kind: "graduated"; item: GraduatedItem }
  | null;

export function ParkingLotView({ onSelectLvt }: ParkingLotViewProps) {
  const projection = getProjection();
  const byLvtId = lvtIndex();

  // Group active items by section, preserving first-seen section order.
  const groups: { section: string; items: PlItem[] }[] = [];
  const groupIndex = new Map<string, number>();
  for (const item of projection.parkingLot) {
    let idx = groupIndex.get(item.section);
    if (idx === undefined) {
      idx = groups.length;
      groupIndex.set(item.section, idx);
      groups.push({ section: item.section, items: [] });
    }
    groups[idx].items.push(item);
  }

  const RESOLVED_KEY = "__resolved__";

  // All groups (including the resolved landscape) start collapsed.
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

  const selection: Selection = (() => {
    if (!selectedId) return null;
    const active = projection.parkingLot.find((i) => i.id === selectedId);
    if (active) return { kind: "active", item: active };
    const grad = projection.graduated.find((g) => g.id === selectedId);
    if (grad) return { kind: "graduated", item: grad };
    return null;
  })();

  return (
    <div className="rm-strategy">
      <div className="rm-tree-pane">
        <div className="rm-pl-note">
          Unresolved work and ideas across the complete logical parking lot, grouped
          by the section each item sits under. Order carries no priority.
        </div>

        <div className="rm-tree">
          {groups.map((group) => {
            const isOpen = expanded.has(group.section);
            return (
              <div key={group.section} className="rm-tree-node">
                <div
                  className="rm-row rm-row-group"
                  onClick={() => toggle(group.section)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(group.section);
                    }
                  }}
                >
                  <button
                    className="rm-twisty"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(group.section);
                    }}
                  >
                    {isOpen ? "▾" : "▸"}
                  </button>
                  <span className="rm-pl-group-name">{group.section}</span>
                  <span className="rm-pl-group-count">{group.items.length}</span>
                </div>
                {isOpen && (
                  <div className="rm-tree-children">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className={`rm-row rm-row-pl${
                          selectedId === item.id ? " rm-row-selected" : ""
                        }`}
                        style={{ paddingLeft: "30px" }}
                        onClick={() => setSelectedId(item.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(item.id);
                          }
                        }}
                      >
                        <span className="rm-node-name">{item.name ?? "(unnamed)"}</span>
                        <span className="rm-node-id">{item.id}</span>
                        {(item.relatedLvtIds.length > 0 || item.relatedArIds.length > 0) && (
                          <span className="rm-row-rel-dot" title="Has explicit strategy/architecture relationships">
                            ●
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Resolved landscape — graduated / closed, collapsed by default */}
          <div className="rm-tree-node rm-tree-node-resolved">
            <div
              className="rm-row rm-row-group"
              onClick={() => toggle(RESOLVED_KEY)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(RESOLVED_KEY);
                }
              }}
            >
              <button
                className="rm-twisty"
                aria-label={expanded.has(RESOLVED_KEY) ? "Collapse" : "Expand"}
                aria-expanded={expanded.has(RESOLVED_KEY)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(RESOLVED_KEY);
                }}
              >
                {expanded.has(RESOLVED_KEY) ? "▾" : "▸"}
              </button>
              <span className="rm-pl-group-name">Resolved landscape — graduated / closed</span>
              <span className="rm-pl-group-count">{projection.graduated.length}</span>
            </div>
            {expanded.has(RESOLVED_KEY) && (
              <div className="rm-tree-children">
                {projection.graduated.map((g) => (
                  <div
                    key={g.id}
                    className={`rm-row rm-row-pl rm-row-resolved${
                      selectedId === g.id ? " rm-row-selected" : ""
                    }`}
                    style={{ paddingLeft: "30px" }}
                    onClick={() => setSelectedId(g.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(g.id);
                      }
                    }}
                  >
                    <span className="rm-node-name">{g.name ?? "(unnamed)"}</span>
                    <span className="rm-node-id">{g.id}</span>
                    <span className="rm-pl-disposition">{g.disposition}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rm-detail-pane">
        <PlDetail selection={selection} byLvtId={byLvtId} onSelectLvt={onSelectLvt} />
      </div>
    </div>
  );
}

interface PlDetailProps {
  selection: Selection;
  byLvtId: ReturnType<typeof lvtIndex>;
  onSelectLvt: (id: string) => void;
}

function PlDetail({ selection, byLvtId, onSelectLvt }: PlDetailProps) {
  if (!selection) {
    return (
      <div className="rm-detail rm-detail-empty">
        Select a parking-lot item to see what it is, its state, section, source, and
        explicit relationships — or, for resolved items, its disposition and destination.
      </div>
    );
  }

  if (selection.kind === "graduated") {
    const g = selection.item;
    return (
      <div className="rm-detail">
        <div className="rm-detail-head">
          <span className="rm-type-tag rm-type-initiative">Resolved</span>
          <h2 className="rm-detail-name">{g.name ?? "(unnamed)"}</h2>
          <div className="rm-detail-ids">
            <span className="rm-node-id">{g.id}</span>
          </div>
        </div>
        <section className="rm-detail-section">
          <h3 className="rm-detail-section-title">Disposition</h3>
          <p className="rm-detail-desc">{g.disposition}</p>
        </section>
        {g.destination && (
          <section className="rm-detail-section">
            <h3 className="rm-detail-section-title">Destination</h3>
            <p className="rm-detail-desc">{g.destination}</p>
          </section>
        )}
      </div>
    );
  }

  const item = selection.item;
  return (
    <div className="rm-detail">
      <div className="rm-detail-head">
        <span className="rm-type-tag rm-type-bet">Parking Lot</span>
        <h2 className="rm-detail-name">{item.name ?? "(unnamed)"}</h2>
        <div className="rm-detail-ids">
          <span className="rm-node-id">{item.id}</span>
        </div>
      </div>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">What this is</h3>
        {item.description ? (
          <p className="rm-detail-desc">
            {item.description}
            {item.descriptionTruncated && (
              <span className="rm-detail-more" title={`Full text in docs/${item.sourceFile}`}>
                {" "}… (full text in the canonical source)
              </span>
            )}
          </p>
        ) : (
          <p className="rm-none">The canonical source provides no description for this item.</p>
        )}
      </section>

      {item.state && (
        <section className="rm-detail-section">
          <h3 className="rm-detail-section-title">State</h3>
          <p className="rm-detail-desc">{item.state}</p>
        </section>
      )}

      {/* Full canonical record body — verbosity-first, faithful projection of
          the record's subsections. The untitled lead (level 0) is omitted here
          because it is already shown as "What this is" above. */}
      {item.sections
        .filter((s) => s.heading !== "")
        .map((section, si) => (
          <section key={si} className="rm-detail-section">
            <h3 className="rm-detail-section-title rm-bug-section-title">{section.heading}</h3>
            {section.content && <pre className="rm-domain-content">{section.content}</pre>}
            {section.tables.map((table, ti) => (
              <div key={ti} className="rm-domain-table-wrap">
                <table className="rm-domain-table">
                  <thead>
                    <tr>
                      {table.header.map((h, hi) => (
                        <th key={hi}>{h.replace(/\*\*/g, "").replace(/`/g, "").trim()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((c, ci) => (
                          <td key={ci}>{c.replace(/\*\*/g, "").replace(/`/g, "").trim()}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        ))}

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Section</h3>
        <p className="rm-detail-desc">{item.section}</p>
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Related strategy (explicit)</h3>
        {item.relatedLvtIds.length === 0 ? (
          <p className="rm-none">
            No strategy node explicitly references this item. (The authority does not
            state one — this is not the same as “no relationship exists.”)
          </p>
        ) : (
          <ul className="rm-rel-list">
            {item.relatedLvtIds.map((lvtId) => {
              const node = byLvtId.get(lvtId);
              return (
                <li key={lvtId} className="rm-rel-item">
                  <button
                    className="rm-chip rm-chip-lvt"
                    onClick={() => onSelectLvt(lvtId)}
                    title={node ? node.name : lvtId}
                  >
                    {node ? node.name : lvtId}
                  </button>
                  <span className="rm-rel-section">{lvtId}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Related architectural pressure (explicit)</h3>
        {item.relatedArIds.length === 0 ? (
          <p className="rm-none">No architectural pressure explicitly references this item.</p>
        ) : (
          <ul className="rm-rel-list">
            {item.relatedArIds.map((arId) => (
              <li key={arId} className="rm-rel-item">
                <span className="rm-rel-id rm-rel-ar">{arId}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Source</h3>
        <p className="rm-detail-desc rm-detail-source">{item.sourceFile}</p>
      </section>
    </div>
  );
}
