/**
 * Workspace persistence abstraction.
 *
 * Stores the user's laboratory configuration in localStorage so that
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

import type { DeltaTieBreaker } from "../domain/policy";

const STORAGE_KEY = "options-prototype:workspace";

export interface Workspace {
  // App-level
  activeTab: string;

  // Provider
  providerKey: string;

  // Selection
  selectedSymbol: string;
  selectedExpiration: string;

  // Policy
  callTargetDelta: number;
  putTargetDelta: number;
  tieBreaker: DeltaTieBreaker;

  // Display
  strikesCount: number;
  showFullEvidence: boolean;
}

const DEFAULT_WORKSPACE: Workspace = {
  activeTab: "recommendation",
  providerKey: "tradier",
  selectedSymbol: "SPY",
  selectedExpiration: "",
  callTargetDelta: 0.30,
  putTargetDelta: 0.30,
  tieBreaker: "PreferOTM",
  strikesCount: 10,
  showFullEvidence: false,
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
