/**
 * Principles view — Wheelwright's ratified enduring principles.
 *
 * Projects the canonical register (docs/principles.md): enduring constraints on
 * HOW Wheelwright is built and operated — distinct from Vision (where we're
 * going), AR (pressure), ADR (decision), and LVT/work (what we pursue).
 *
 * Read-only projection. The register is the sole source of truth for which
 * principles are ratified; nothing is inferred. Grouped by family; tree +
 * details-pane form consistent with the other lenses, collapsed by default.
 */

import { useState } from "react";
import type { PrincipleRecord } from "./roadmap-projection-types";
import { getProjection } from "./use-roadmap-projection";

export function PrinciplesView() {
  const { principles } = getProjection();

  // Group by family, preserving first-seen order.
  const groups: { family: string; items: PrincipleRecord[] }[] = [];
  const idx = new Map<string, number>();
  for (const pr of principles) {
    let i = idx.get(pr.family);
    if (i === undefined) {
      i = groups.length;
      idx.set(pr.family, i);
      groups.push({ family: pr.family, items: [] });
    }
    groups[i].items.push(pr);
  }

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

  const selected = selectedId
    ? principles.find((pr) => pr.id === selectedId) ?? null
    : null;

  if (principles.length === 0) {
    return (
      <div className="rm-single">
        <div className="rm-honest-empty">
          <div className="rm-honest-empty-title">No ratified principles registered yet.</div>
          <p>
            Principles appear here only when established in <code>docs/principles.md</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-strategy">
      <div className="rm-tree-pane">
        <div className="rm-pl-note">
          Ratified enduring principles — constraints on how Wheelwright is built and
          operated. Projected read-only from the canonical register. If it appears here,
          Wheelwright considers it a ratified principle.
        </div>

        <div className="rm-tree">
          {groups.map((group) => {
            const isOpen = expanded.has(group.family);
            return (
              <div key={group.family} className="rm-tree-node">
                <div
                  className="rm-row rm-row-group"
                  onClick={() => toggle(group.family)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(group.family);
                    }
                  }}
                >
                  <button
                    className="rm-twisty"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                    aria-expanded={isOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(group.family);
                    }}
                  >
                    {isOpen ? "▾" : "▸"}
                  </button>
                  <span className="rm-pl-group-name">{group.family}</span>
                  <span className="rm-pl-group-count">{group.items.length}</span>
                </div>
                {isOpen && (
                  <div className="rm-tree-children">
                    {group.items.map((pr) => (
                      <div
                        key={pr.id}
                        className={`rm-row rm-row-pl${selectedId === pr.id ? " rm-row-selected" : ""}`}
                        style={{ paddingLeft: "30px" }}
                        onClick={() => setSelectedId(pr.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(pr.id);
                          }
                        }}
                      >
                        <span className="rm-node-name">{pr.name}</span>
                        <span className="rm-node-id">{pr.id}</span>
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
              <span className="rm-type-tag rm-type-principle-tag">Principle</span>
              <h2 className="rm-detail-name">{selected.name}</h2>
              <div className="rm-detail-ids">
                <span className="rm-node-id">{selected.id}</span>
                <span className="rm-node-alias">{selected.family}</span>
              </div>
            </div>
            {selected.statement && (
              <section className="rm-detail-section">
                <h3 className="rm-detail-section-title">Statement</h3>
                <p className="rm-detail-desc">{selected.statement}</p>
              </section>
            )}
            {selected.provenance && (
              <section className="rm-detail-section">
                <h3 className="rm-detail-section-title">Provenance</h3>
                <p className="rm-detail-desc rm-detail-source">{selected.provenance}</p>
              </section>
            )}
          </div>
        ) : (
          <div className="rm-detail rm-detail-empty">
            Select a principle to see its statement and family.
          </div>
        )}
      </div>
    </div>
  );
}
