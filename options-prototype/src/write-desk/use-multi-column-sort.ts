/**
 * Multi-Column Sort Hook
 *
 * Provides chained sort across multiple columns for deployment tables.
 *
 * Interaction:
 *   - Click: replace primary sort with the clicked column
 *   - Shift+Click: add/toggle the clicked column as secondary (or tertiary, etc.)
 *   - Click on an already-active primary: toggle its direction
 *   - Shift+Click on an already-active secondary: toggle its direction or remove it
 *
 * Comparator chains: primary → secondary → ... → falls through to original order on tie.
 *
 * Workspace persistence: stores an array of { key, dir } tuples per table.
 */

import { useState, useMemo, useCallback } from "react";

export type SortDir = "asc" | "desc";

export interface SortColumn {
  key: string;
  dir: SortDir;
}

export interface MultiColumnSortResult<T> {
  sorted: T[];
  handleSort: (key: string, event?: { shiftKey?: boolean }) => void;
  columns: SortColumn[];
  /** Returns " ▲" / " ▼" for primary, " ²▲" / " ²▼" for secondary, "" otherwise */
  indicator: (key: string) => string;
  /** Whether the table is in its default/recommendation order */
  isDefaultOrder: boolean;
  /** The primary sort key (for display purposes) */
  primaryKey: string;
}

/**
 * Default direction for a given sort key.
 * Most numeric columns default to descending (highest first).
 * Alpha/rank columns default to ascending.
 */
function defaultDirForKey(key: string): SortDir {
  if (key === "rank" || key === "symbol" || key === "entryMechanism" || key === "expiration") {
    return "asc";
  }
  return "desc";
}

/**
 * Extract a sort-comparable value from an item by key.
 */
function extractValue(item: Record<string, unknown>, key: string): unknown {
  if (key === "assessment") {
    const assessment = item.assessment as { score?: number } | undefined;
    return assessment?.score;
  }
  return item[key];
}

/**
 * Compare two values (string or number) with null handling.
 */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }

  const na = Number(a);
  const nb = Number(b);
  if (isNaN(na) && isNaN(nb)) return 0;
  if (isNaN(na)) return 1;
  if (isNaN(nb)) return -1;
  return na - nb;
}

export function useMultiColumnSort<T>(
  items: T[],
  initialColumns: SortColumn[],
  defaultColumns: SortColumn[],
  onSortChange?: (columns: SortColumn[]) => void,
): MultiColumnSortResult<T> {
  const [columns, setColumns] = useState<SortColumn[]>(initialColumns);

  const handleSort = useCallback((key: string, event?: { shiftKey?: boolean }) => {
    setColumns((prev) => {
      let next: SortColumn[];

      if (event?.shiftKey) {
        // Shift+Click: add/toggle secondary sort
        const existingIdx = prev.findIndex((c) => c.key === key);
        if (existingIdx === 0) {
          // Shift+Click on primary: toggle its direction
          next = [...prev];
          next[0] = { key, dir: prev[0].dir === "asc" ? "desc" : "asc" };
        } else if (existingIdx > 0) {
          // Already a secondary — toggle direction, or remove if clicking a third time
          next = [...prev];
          next[existingIdx] = { key, dir: prev[existingIdx].dir === "asc" ? "desc" : "asc" };
        } else {
          // New secondary column (append, max 3 levels)
          next = [...prev, { key, dir: defaultDirForKey(key) }].slice(0, 3);
        }
      } else {
        // Plain click: replace with single-column sort
        const existing = prev.find((c) => c.key === key);
        if (existing && prev[0]?.key === key) {
          // Clicking the active primary: toggle direction
          next = [{ key, dir: prev[0].dir === "asc" ? "desc" : "asc" }];
        } else {
          // New primary (clears secondaries)
          next = [{ key, dir: defaultDirForKey(key) }];
        }
      }

      onSortChange?.(next);
      return next;
    });
  }, [onSortChange]);

  const sorted = useMemo(() => {
    if (columns.length === 0) return items;

    return [...items].sort((a, b) => {
      const aRec = a as Record<string, unknown>;
      const bRec = b as Record<string, unknown>;

      for (const { key, dir } of columns) {
        const aVal = extractValue(aRec, key);
        const bVal = extractValue(bRec, key);
        const cmp = compareValues(aVal, bVal);
        if (cmp !== 0) {
          return dir === "asc" ? cmp : -cmp;
        }
      }
      return 0; // all columns tied — preserve original order
    });
  }, [items, columns]);

  const indicator = useCallback((key: string): string => {
    const idx = columns.findIndex((c) => c.key === key);
    if (idx < 0) return "";
    const arrow = columns[idx].dir === "asc" ? "▲" : "▼";
    if (idx === 0) return ` ${arrow}`;
    return ` ${idx + 1}${arrow}`;
  }, [columns]);

  const isDefaultOrder = columns.length === defaultColumns.length &&
    columns.every((c, i) => c.key === defaultColumns[i].key && c.dir === defaultColumns[i].dir);

  const primaryKey = columns[0]?.key ?? "";

  return { sorted, handleSort, columns, indicator, isDefaultOrder, primaryKey };
}
