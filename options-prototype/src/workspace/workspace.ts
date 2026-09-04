/**
 * Workspace persistence abstraction.
 *
 * Stores the operator's workspace configuration in localStorage so that
 * refreshing or restarting the browser restores the workbench state.
 *
 * Design:
 *   - Single workspace (auto-saved, auto-restored)
 *   - All UI state that represents a "policy decision" is persisted
 *   - Market data is NOT persisted (always fresh from provider)
 *   - Abstraction prepares for future: named workspaces, export, cloud sync
 *
 * Only one module should read/write localStorage: this one.
 */

const STORAGE_KEY = "options-prototype:workspace";

export interface Workspace {
  // Deployment policy (persisted field names remain stable)
  writeDeskTargetDelta: number;
  writeDeskTargetDte: number;
  writeDeskRankingMode: string;
  writeDeskDeltaMin: number;
  writeDeskDeltaMax: number;
  writeDeskShowCount: number;

  // Deployment section state
  writeDeskPutsCollapsed: boolean;
  writeDeskCallsCollapsed: boolean;
  writeDeskBuyWritesCollapsed: boolean;
  writeDeskCrossEntryCollapsed: boolean;

  // Deployment section order (drag/reorder)
  writeDeskSectionOrder: string[];

  // Deployment table state (sticky across navigation)
  writeDeskAffordableOnly: boolean;
  writeDeskShowDanger: boolean;
  writeDeskShowWideSpread: boolean;
  writeDeskCrossEntryAffordableOnly: boolean;

  // Deployment cross-entry show count
  writeDeskCrossEntryShowCount: number;

  // Deployment table sort state
  writeDeskPutSortKey: string;
  writeDeskPutSortDir: string;
  writeDeskCallSortKey: string;
  writeDeskCallSortDir: string;
  writeDeskBuyWriteSortKey: string;
  writeDeskBuyWriteSortDir: string;
  writeDeskCrossEntrySortKey: string;
  writeDeskCrossEntrySortDir: string;

  // Deployment portfolio source
  writeDeskSource: string;

  // Mission Context (first Situation Architecture primitive)
  /** Monthly production target in dollars. Null = not configured. */
  missionTarget: number | null;
}

const DEFAULT_WORKSPACE: Workspace = {
  writeDeskTargetDelta: 0.30,
  writeDeskTargetDte: 21,
  writeDeskRankingMode: "execution_first",
  writeDeskDeltaMin: 0.15,
  writeDeskDeltaMax: 0.50,
  writeDeskShowCount: 20,
  writeDeskPutsCollapsed: false,
  writeDeskCallsCollapsed: false,
  writeDeskBuyWritesCollapsed: false,
  writeDeskCrossEntryCollapsed: false,
  writeDeskSectionOrder: ["cross-entry", "puts", "calls", "buy-writes"],
  writeDeskAffordableOnly: false,
  writeDeskShowDanger: false,
  writeDeskShowWideSpread: false,
  writeDeskCrossEntryAffordableOnly: false,
  writeDeskCrossEntryShowCount: 10,
  writeDeskPutSortKey: "rank",
  writeDeskPutSortDir: "asc",
  writeDeskCallSortKey: "rank",
  writeDeskCallSortDir: "asc",
  writeDeskBuyWriteSortKey: "rank",
  writeDeskBuyWriteSortDir: "asc",
  writeDeskCrossEntrySortKey: "productionV0",
  writeDeskCrossEntrySortDir: "desc",
  writeDeskSource: "demo",
  missionTarget: null,
};

/**
 * Load workspace from localStorage.
 * Returns defaults merged with any stored values.
 * Never throws — returns defaults on parse failure.
 */
export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_WORKSPACE };
    const parsed = JSON.parse(raw);
    // Merge with defaults to handle schema evolution
    return { ...DEFAULT_WORKSPACE, ...parsed };
  } catch {
    return { ...DEFAULT_WORKSPACE };
  }
}

/**
 * Save entire workspace to localStorage.
 */
export function saveWorkspace(workspace: Workspace): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  } catch {
    // localStorage may be full or unavailable — fail silently
  }
}

/**
 * Update specific workspace fields and persist immediately.
 * Returns the updated workspace.
 */
export function updateWorkspace(partial: Partial<Workspace>): Workspace {
  const current = loadWorkspace();
  const updated = { ...current, ...partial };
  saveWorkspace(updated);
  return updated;
}

/**
 * Reset workspace to defaults.
 */
export function resetWorkspace(): Workspace {
  saveWorkspace(DEFAULT_WORKSPACE);
  return { ...DEFAULT_WORKSPACE };
}

/**
 * Get the default workspace (for reference/comparison).
 */
export function getDefaultWorkspace(): Workspace {
  return { ...DEFAULT_WORKSPACE };
}
