/**
 * Strategy tree — the Lean Value Tree with progressive disclosure.
 *
 *   Vision → Goals → Bets / Directions → Initiatives / Experiments
 *
 * Parentage comes from the projection (derived from canonical indentation). The
 * human-readable name dominates; the semantic ID is shown subordinately. Node
 * type is distinguished by a restrained type tag and color, not decoration.
 */

import { useState } from "react";
import type { LvtNode, LvtNodeType } from "./roadmap-projection-types";
import { getProjection } from "./use-roadmap-projection";

interface StrategyTreeProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const TYPE_LABEL: Record<LvtNodeType, string> = {
  vision: "Vision",
  goal: "Goal",
  bet: "Bet",
  direction: "Direction",
  initiative: "Initiative",
  experiment: "Experiment",
};

export function StrategyTree({ selectedId, onSelect }: StrategyTreeProps) {
  const projection = getProjection();
  const byId = new Map<string, LvtNode>(projection.lvt.map((n) => [n.id, n]));
  const vision = projection.lvt.find((n) => n.type === "vision") ?? null;

  // All nodes start collapsed; the operator expands progressively from the root.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set<string>());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!vision) {
    return <div className="rm-empty">No strategy tree available in the projection.</div>;
  }

  const renderNode = (node: LvtNode, depth: number): React.ReactNode => {
    const hasChildren = node.childIds.length > 0;
    const isOpen = expanded.has(node.id);
    const isSelected = node.id === selectedId;

    return (
      <div key={node.id} className="rm-tree-node">
        <div
          className={`rm-row rm-row-${node.type}${isSelected ? " rm-row-selected" : ""}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelect(node.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(node.id);
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
                toggle(node.id);
              }}
            >
              {isOpen ? "▾" : "▸"}
            </button>
          ) : (
            <span className="rm-twisty rm-twisty-leaf" />
          )}
          <span className={`rm-type-tag rm-type-${node.type}`}>{TYPE_LABEL[node.type]}</span>
          <span className="rm-node-name">{node.name}</span>
          <span className="rm-node-id">{node.id}</span>
          {node.legacyAlias && <span className="rm-node-alias">{node.legacyAlias}</span>}
        </div>
        {hasChildren && isOpen && (
          <div className="rm-tree-children">
            {node.childIds.map((childId) => {
              const child = byId.get(childId);
              return child ? renderNode(child, depth + 1) : null;
            })}
          </div>
        )}
      </div>
    );
  };

  return <div className="rm-tree">{renderNode(vision, 0)}</div>;
}
