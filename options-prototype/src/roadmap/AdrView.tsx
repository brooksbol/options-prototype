/**
 * ADR view — Architecture Decision Records (docs/07c-adrs.md).
 *
 * Layout mirrors the other lenses: a tree pane on the left (each ADR is a row;
 * expanding it reveals date and status as child context) and a details pane on
 * the right showing the selected ADR's status, date, and concise context excerpt.
 *
 * ADRs are ratified decisions (Category B authority). The full text remains
 * canonical in the Markdown; this is a read-only projection. Trees start
 * collapsed.
 */

import { useState } from "react";
import type { AdrRecord } from "./roadmap-projection-types";
import { getProjection } from "./use-roadmap-projection";

export function AdrView() {
  const projection = getProjection();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selected = selectedId
    ? projection.adrs.find((a) => a.id === selectedId) ?? null
    : null;

  return (
    <div className="rm-strategy">
      <div className="rm-tree-pane">
        <div className="rm-pl-note">
          Ratified architecture decisions. These constrain evolution and record what
          was decided and why. The full text is canonical in the repository.
        </div>

        <div className="rm-tree">
          {projection.adrs.map((adr) => {
            const isOpen = expanded.has(adr.id);
            const hasChildren = Boolean(adr.date || adr.status);
            return (
              <div key={adr.id} className="rm-tree-node">
                <div
                  className={`rm-row rm-row-adr${selectedId === adr.id ? " rm-row-selected" : ""}`}
                  style={{ paddingLeft: "8px" }}
                  onClick={() => setSelectedId(adr.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(adr.id);
                    }
                  }}
                >
                  {hasChildren ? (
                    <button
                      className="rm-twisty"
                      aria-label={isOpen ? "Collapse" : "Expand"}
                      aria-expanded={isOpen}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(adr.id);
                      }}
                    >
                      {isOpen ? "▾" : "▸"}
                    </button>
                  ) : (
                    <span className="rm-twisty rm-twisty-leaf" />
                  )}
                  <span className="rm-type-tag rm-type-adr-tag">ADR</span>
                  <span className="rm-node-name">{adr.title}</span>
                  <span className="rm-node-id">{adr.id}</span>
                  {adr.status && <span className="rm-adr-status">{adr.status}</span>}
                </div>
                {hasChildren && isOpen && (
                  <div className="rm-tree-children">
                    {adr.status && (
                      <div className="rm-row rm-row-child rm-row-static" style={{ paddingLeft: "30px" }}>
                        <span className="rm-child-role">status</span>
                        <span className="rm-node-name">{adr.status}</span>
                      </div>
                    )}
                    {adr.date && (
                      <div className="rm-row rm-row-child rm-row-static" style={{ paddingLeft: "30px" }}>
                        <span className="rm-child-role">date</span>
                        <span className="rm-node-name">{adr.date}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rm-detail-pane">
        <AdrDetail selected={selected} />
      </div>
    </div>
  );
}

function AdrDetail({ selected }: { selected: AdrRecord | null }) {
  if (!selected) {
    return (
      <div className="rm-detail rm-detail-empty">
        Select an architecture decision to see its status, date, context, decision, and
        consequences.
      </div>
    );
  }

  return (
    <div className="rm-detail">
      <div className="rm-detail-head">
        <span className="rm-type-tag rm-type-adr-tag">ADR</span>
        <h2 className="rm-detail-name">{selected.title}</h2>
        <div className="rm-detail-ids">
          <span className="rm-node-id">{selected.id}</span>
          {selected.status && <span className="rm-node-alias">{selected.status}</span>}
          {selected.date && <span className="rm-node-alias">{selected.date}</span>}
        </div>
      </div>

      {selected.context && (
        <section className="rm-detail-section">
          <h3 className="rm-detail-section-title">Context</h3>
          <pre className="rm-domain-content">{selected.context}</pre>
        </section>
      )}

      {selected.decision && (
        <section className="rm-detail-section">
          <h3 className="rm-detail-section-title">Decision</h3>
          <pre className="rm-domain-content">{selected.decision}</pre>
        </section>
      )}

      {selected.consequences && (
        <section className="rm-detail-section">
          <h3 className="rm-detail-section-title">Consequences</h3>
          <pre className="rm-domain-content">{selected.consequences}</pre>
        </section>
      )}

      <p className="rm-none">
        Full canonical record in <code>docs/07c-adrs.md</code>.
      </p>
    </div>
  );
}
