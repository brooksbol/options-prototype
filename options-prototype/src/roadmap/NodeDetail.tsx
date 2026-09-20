/**
 * Node detail — the selected LVT node's description and its EXPLICIT relationships.
 *
 * Shows:
 *   - node type, human name, semantic id, legacy alias (traceability only);
 *   - the concise authoritative description;
 *   - architectural pressures whose "Pressure from:" explicitly cites this node;
 *   - parking-lot items whose text explicitly references this node.
 *
 * When no authoritative relationship exists, it says so — it does not infer one.
 */

import type { LvtNode, LvtNodeType } from "./roadmap-projection-types";
import { arPressuresForLvt, plItemsForLvt } from "./use-roadmap-projection";

interface NodeDetailProps {
  node: LvtNode | null;
  onSelectLvt: (id: string) => void;
}

const TYPE_LABEL: Record<LvtNodeType, string> = {
  vision: "Vision",
  goal: "Goal",
  bet: "Bet",
  direction: "Direction",
  initiative: "Initiative",
  experiment: "Experiment",
};

export function NodeDetail({ node }: NodeDetailProps) {
  if (!node) {
    return (
      <div className="rm-detail rm-detail-empty">
        Select a strategy node to see its description and the work explicitly related
        to it.
      </div>
    );
  }

  const relatedAr = arPressuresForLvt(node.id);
  const relatedPl = plItemsForLvt(node.id);

  return (
    <div className="rm-detail">
      <div className="rm-detail-head">
        <span className={`rm-type-tag rm-type-${node.type}`}>{TYPE_LABEL[node.type]}</span>
        <h2 className="rm-detail-name">{node.name}</h2>
        <div className="rm-detail-ids">
          <span className="rm-node-id">{node.id}</span>
          {node.legacyAlias && (
            <span className="rm-node-alias" title="Legacy alias (historical traceability only)">
              legacy {node.legacyAlias}
            </span>
          )}
        </div>
      </div>

      {node.description && <p className="rm-detail-desc">{node.description}</p>}

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Architectural pressure</h3>
        {relatedAr.length === 0 ? (
          <p className="rm-none">No architectural pressure explicitly cites this node.</p>
        ) : (
          <ul className="rm-rel-list">
            {relatedAr.map((ar) => (
              <li key={ar.id} className="rm-rel-item">
                <span className="rm-rel-id rm-rel-ar">{ar.id}</span>
                <span className="rm-rel-name">{ar.title}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rm-detail-section">
        <h3 className="rm-detail-section-title">Related parking-lot work</h3>
        {relatedPl.length === 0 ? (
          <p className="rm-none">
            No parking-lot item explicitly references this node. (The authority does
            not state one — this is not the same as “no related work exists.”)
          </p>
        ) : (
          <ul className="rm-rel-list">
            {relatedPl.map((pl) => (
              <li key={pl.id} className="rm-rel-item">
                <span className="rm-rel-id rm-rel-pl">{pl.id}</span>
                <span className="rm-rel-name">{pl.name ?? "(unnamed)"}</span>
                <span className="rm-rel-section">{pl.section}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
