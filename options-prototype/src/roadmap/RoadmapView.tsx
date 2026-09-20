/**
 * Roadmap — operator surface (/app/roadmap).
 *
 * A living strategic map that answers, for the Principal:
 *
 *   "What remains to be explored, learned, decided, reconciled, or built in
 *    Wheelwright, and how does it relate to the strategy where that relationship
 *    is actually known?"
 *
 * This surface is a READ-ONLY PROJECTION of canonical authority. It never edits
 * or fetches roadmap truth. Relationships shown are explicit-only: they are
 * exactly what the canonical Markdown states. Where no authoritative relationship
 * exists, the surface says so rather than inventing one. It shows no priority,
 * sequence, progress, dates, owners, or authorization state, because the
 * authority encodes none.
 *
 * PROVISIONAL UX: the interaction model (progressive disclosure, detail panel,
 * view toggle) is a first implementation hypothesis pending Principal inspection,
 * not ratified information architecture.
 */

import { useState } from "react";
import type { LvtNode } from "./roadmap-projection-types";
import { getProjection } from "./use-roadmap-projection";
import { StrategyTree } from "./StrategyTree";
import { NodeDetail } from "./NodeDetail";
import { ArchitectureView } from "./ArchitectureView";
import { ParkingLotView } from "./ParkingLotView";
import { AdrView } from "./AdrView";
import { PriorityView } from "./PriorityView";
import { ComingSoonView } from "./ComingSoonView";
import { PrinciplesView } from "./PrinciplesView";
import { DomainView } from "./DomainView";
import { BugsView } from "./BugsView";
import "./roadmap.css";

type RoadmapLens =
  | "strategy"
  | "principles"
  | "domain"
  | "priority"
  | "architecture"
  | "adr"
  | "parking-lot"
  | "bugs"
  | "coming-soon";

const LENSES: { id: RoadmapLens; label: string }[] = [
  { id: "strategy", label: "Strategy" },
  { id: "principles", label: "Principles" },
  { id: "domain", label: "Domain" },
  { id: "priority", label: "Priority" },
  { id: "architecture", label: "Architecture" },
  { id: "adr", label: "ADRs" },
  { id: "parking-lot", label: "Parking Lot" },
  { id: "bugs", label: "Bugs" },
  { id: "coming-soon", label: "Coming Soon" },
];

export function RoadmapView() {
  const projection = getProjection();
  const [lens, setLens] = useState<RoadmapLens>("strategy");
  const [selectedLvtId, setSelectedLvtId] = useState<string | null>(null);

  const lvtById = new Map<string, LvtNode>(projection.lvt.map((n) => [n.id, n]));
  const selectedNode = selectedLvtId ? lvtById.get(selectedLvtId) ?? null : null;

  const { counts } = projection.meta;

  return (
    <div className="rm">
      <div className="rm-header">
        <div className="rm-question">
          What remains to be explored, learned, decided, reconciled, or built — and
          how it relates to strategy where the relationship is known.
        </div>
        <div className="rm-lens-toggle" role="tablist" aria-label="Roadmap views">
          {LENSES.map((l) => (
            <button
              key={l.id}
              role="tab"
              aria-selected={lens === l.id}
              className="rm-lens-btn"
              onClick={() => setLens(l.id)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="rm-counts">
          <span title="Goals in the Lean Value Tree">{counts.lvtByType.goal} goals</span>
          <span className="rm-count-sep">·</span>
          <span title="Bets in the Lean Value Tree">{counts.lvtByType.bet} bets</span>
          <span className="rm-count-sep">·</span>
          <span title="Ratified principles">{counts.principleTotal} principles</span>
          <span className="rm-count-sep">·</span>
          <span title="Domain reference entries">{counts.domainEntryTotal} domain</span>
          <span className="rm-count-sep">·</span>
          <span title="Architectural pressures">{counts.arTotal} AR</span>
          <span className="rm-count-sep">·</span>
          <span title="Architecture decision records">{counts.adrTotal} ADR</span>
          <span className="rm-count-sep">·</span>
          <span title="Parking-lot items (unresolved work / ideas)">{counts.plTotal} PL</span>
          <span className="rm-count-sep">·</span>
          <span title="Known defects">{counts.bugTotal} bugs</span>
        </div>
      </div>

      <div className="rm-body">
        {lens === "strategy" && (
          <div className="rm-strategy">
            <div className="rm-tree-pane">
              <StrategyTree selectedId={selectedLvtId} onSelect={setSelectedLvtId} />
            </div>
            <div className="rm-detail-pane">
              <NodeDetail node={selectedNode} onSelectLvt={setSelectedLvtId} />
            </div>
          </div>
        )}

        {lens === "architecture" && <ArchitectureView />}

        {lens === "principles" && <PrinciplesView />}

        {lens === "domain" && <DomainView />}

        {lens === "priority" && <PriorityView />}

        {lens === "adr" && <AdrView />}

        {lens === "bugs" && <BugsView />}

        {lens === "coming-soon" && <ComingSoonView />}

        {lens === "parking-lot" && (
          <ParkingLotView
            onSelectLvt={(id) => {
              setSelectedLvtId(id);
              setLens("strategy");
            }}
          />
        )}
      </div>

      <div className="rm-provenance">
        Projection of canonical authority — derived, read-only. Source:{" "}
        {projection.meta.sources.join(", ")}. Relationships shown are explicit-only;
        absence of a relationship means the authority does not state one.
      </div>
    </div>
  );
}
