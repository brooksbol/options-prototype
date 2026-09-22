/**
 * Architecture view — the architecture-roadmap pressures (AR series).
 *
 * Layout mirrors the Strategy and Parking Lot lenses: a tree pane on the left
 * (each AR pressure is a row; expanding it reveals its explicit "Pressure from"
 * LVT sources and any parking-lot items that explicitly reference it) and a
 * details pane on the right for the selected AR.
 *
 * Each AR records structural PRESSURE, not implementation authorization. All
 * relationships shown are explicit-only. Trees start fully collapsed.
 */

import { useState } from "react";
import type { ArPressure } from "./roadmap-projection-types";
import { getProjection, lvtIndex, plItemsForAr } from "./use-roadmap-projection";

export function ArchitectureView() {
  const projection = getProjection();
  const byLvtId = lvtIndex();

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
    ? projection.architecture.find((a) => a.id === selectedId) ?? null
    : null;

  return (
    <div className="rm-strategy">
      <div className="rm-tree-pane">
        <div className="rm-pl-note">
          Architectural pressure revealed by strategic reconciliation. These record
          structural pressure and intended evolution — not implementation authorization.
        </div>

        <div className="rm-tree">
          {projection.architecture.map((ar) => {
            const isOpen = expanded.has(ar.id);
            const relatedPl = plItemsForAr(ar.id);
            const hasChildren = ar.pressureFromLvtIds.length > 0 || relatedPl.length > 0;
            return (
              <div key={ar.id} className="rm-tree-node">
                <div
                  className={`rm-row rm-row-ar${selectedId === ar.id ? " rm-row-selected" : ""}`}
                  style={{ paddingLeft: "8px" }}
                  onClick={() => setSelectedId(ar.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId(ar.id);
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
                        toggle(ar.id);
                      }}
                    >
                      {isOpen ? "▾" : "▸"}
                    </button>
                  ) : (
                    <span className="rm-twisty rm-twisty-leaf" />
                  )}
                  <span className="rm-type-tag rm-type-ar-tag">AR</span>
                  <span className="rm-node-name">{ar.title}</span>
                  <span className="rm-node-id">{ar.id}</span>
                </div>
                {hasChildren && isOpen && (
                  <div className="rm-tree-children">
                    {ar.pressureFromLvtIds.map((lvtId) => {
                      const node = byLvtId.get(lvtId);
                      return (
                        <div
                          key={`${ar.id}-${lvtId}`}
                          className="rm-row rm-row-child rm-row-static"
                          style={{ paddingLeft: "30px" }}
                        >
                          <span className="rm-child-role">pressure from</span>
                          <span className="rm-node-name">{node ? node.name : lvtId}</span>
                          <span className="rm-node-id">{lvtId}</span>
                        </div>
                      );
                    })}
                    {relatedPl.map((pl) => (
                      <div
                        key={`${ar.id}-${pl.id}`}
                        className="rm-row rm-row-child"
                        style={{ paddingLeft: "30px" }}
                      >
                        <span className="rm-child-role">related work</span>
                        <span className="rm-node-name">{pl.name ?? "(unnamed)"}</span>
                        <span className="rm-node-id">{pl.id}</span>
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
        <ArDetail selected={selected} byLvtId={byLvtId} />
      </div>
    </div>
  );
}

interface ArDetailProps {
  selected: ArPressure | null;
  byLvtId: ReturnType<typeof lvtIndex>;
}

function ArDetail({ selected, byLvtId }: ArDetailProps) {
  if (!selected) {
    return (
      <div className="rm-detail rm-detail-empty">
        Select an architectural pressure to see what it is, its candidate transition, the
        strategy it responds to, and the work explicitly related to it.
      </div>
    );
  }

  const relatedPl = plItemsForAr(selected.id);

  return (
    <div className="rm-detail">
      <div className="rm-detail-head">
        <span className="rm-type-tag rm-type-ar-tag">AR</span>
        <h2 className="rm-detail-name">{selected.title}</h2>
        <div className="rm-detail-ids">
          <span className="rm-node-id">{selected.id}</span>
        </div>
      </div>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">What this pressure is</h3>
        {selected.summary ? (
          <p className="rm-detail-desc">
            {selected.summary}
            {selected.summaryTruncated && (
              <span className="rm-detail-more" title="Full text in docs/architecture-roadmap.md">
                {" "}… (full text in the canonical source)
              </span>
            )}
          </p>
        ) : (
          <p className="rm-none">The canonical source provides no overview prose for this pressure.</p>
        )}
      </section>

      {selected.candidateTransition && (
        <section className="rm-detail-section">
          <h3 className="rm-detail-section-title">Candidate transition</h3>
          <p className="rm-detail-desc">{selected.candidateTransition}</p>
        </section>
      )}

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Pressure from (explicit)</h3>
        {selected.pressureFromLvtIds.length === 0 ? (
          <p className="rm-none">No LVT source is explicitly cited.</p>
        ) : (
          <ul className="rm-rel-list">
            {selected.pressureFromLvtIds.map((lvtId) => {
              const node = byLvtId.get(lvtId);
              return (
                <li key={lvtId} className="rm-rel-item">
                  <span className="rm-rel-name">{node ? node.name : lvtId}</span>
                  <span className="rm-rel-section">{lvtId}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Related parking-lot work (explicit)</h3>
        {relatedPl.length === 0 ? (
          <p className="rm-none">No parking-lot item explicitly references this pressure.</p>
        ) : (
          <ul className="rm-rel-list">
            {relatedPl.map((pl) => (
              <li key={pl.id} className="rm-rel-item">
                <span className="rm-rel-id rm-rel-pl">{pl.id}</span>
                <span className="rm-rel-name">{pl.name ?? "(unnamed)"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
