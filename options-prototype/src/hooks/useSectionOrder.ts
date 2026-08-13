/**
 * useSectionOrder — Manages drag/reorder of page sections.
 *
 * Provides HTML5-drag-and-drop state for reordering named sections.
 * Persists the chosen order via a callback (typically to workspace storage).
 *
 * Usage:
 *   const { order, dragHandlers, dropTargetHandlers, dragOverIndex } = useSectionOrder(initialOrder, onOrderChange);
 *   order.map(id => <div {...dropTargetHandlers(id)} key={id}>
 *     <span {...dragHandlers(id)}>⋮⋮</span>
 *     {renderSection(id)}
 *   </div>)
 */

import { useState, useCallback, useRef } from "react";

export function useSectionOrder(
  initialOrder: string[],
  onOrderChange: (order: string[]) => void,
) {
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const draggedRef = useRef<string | null>(null);

  const reorder = useCallback((fromId: string, toId: string) => {
    setOrder((prev) => {
      const fromIdx = prev.indexOf(fromId);
      const toIdx = prev.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const next = [...prev];
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, fromId);
      onOrderChange(next);
      return next;
    });
  }, [onOrderChange]);

  const dragHandlers = useCallback((sectionId: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      draggedRef.current = sectionId;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", sectionId);
      // Add a subtle visual cue
      if (e.currentTarget.parentElement) {
        setTimeout(() => {
          e.currentTarget.parentElement?.classList.add("wd-section-dragging");
        }, 0);
      }
    },
    onDragEnd: (e: React.DragEvent) => {
      draggedRef.current = null;
      setDragOverIndex(null);
      if (e.currentTarget.parentElement) {
        e.currentTarget.parentElement.classList.remove("wd-section-dragging");
      }
    },
  }), []);

  const dropTargetHandlers = useCallback((sectionId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const idx = order.indexOf(sectionId);
      setDragOverIndex(idx);
    },
    onDragLeave: () => {
      setDragOverIndex(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverIndex(null);
      const fromId = draggedRef.current || e.dataTransfer.getData("text/plain");
      if (fromId && fromId !== sectionId) {
        reorder(fromId, sectionId);
      }
    },
  }), [order, reorder]);

  return { order, dragHandlers, dropTargetHandlers, dragOverIndex };
}
