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

/**
 * Workspace fields are organized by SEMANTIC SCOPE (Increment 6). This is a documentation
 * and structural clarification, not a behavioral change — the persisted key and field names
 * are unchanged. The scopes make explicit which state is account-local vs global vs
 * operator/session context, per the ratified multi-account decomposition:
 *
 *   1. GLOBAL STRATEGY DEFAULTS  — policy knobs shared across all accounts. Global.
 *   2. GLOBAL / OPERATOR UI PREFS — view preferences (collapse, sort, filters, show counts,
 *      section order, table toggles). Operator-local, NOT account-local: switching the
 *      active account must NOT change these.
 *   3. APPLICATION / OPERATOR CONTEXT — the active BrokerageAccount selection. Durable
 *      operator preference; the seam that determines which account's account-local state is
 *      shown. Not itself account-local.
 *   4. GLOBAL MISSION — the monthly production target. Global by Principal resolution; NOT
 *      partitioned per account (no per-account mission override machinery in this phase).
 *
 * NOTE: account-LOCAL state (snapshot, balances, positions, intents, capital history,
 * outlook) does NOT live in the Workspace — it is keyed by brokerageAccountId in its own
 * per-account stores (Increments 2–5). The Workspace deliberately holds none of it.
 */
export interface Workspace {
  // ── Scope 1: GLOBAL STRATEGY DEFAULTS (shared across all accounts) ──
  // Deployment policy (persisted field names remain stable)
  writeDeskTargetDelta: number;
  writeDeskTargetDte: number;
  writeDeskRankingMode: string;
  writeDeskDeltaMin: number;
  writeDeskDeltaMax: number;

  // ── Scope 2: GLOBAL / OPERATOR UI PREFERENCES (NOT account-local) ──
  /** Puts table show count. null = "-" = all / unlimited. */
  writeDeskShowCount: number | null;

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

  // Deployment cross-entry show count (null = "-" = all / unlimited)
  writeDeskCrossEntryShowCount: number | null;

  // Deployment cross-entry DTE bounds (null = no bound)
  writeDeskCrossEntryDteMin: number | null;
  writeDeskCrossEntryDteMax: number | null;

  // Deployment cross-entry symbol filter (empty = no filter)
  writeDeskCrossEntrySymbol: string;

  // Deployment cross-entry capital-required bounds (null = no bound)
  writeDeskCrossEntryCapitalMin: number | null;
  writeDeskCrossEntryCapitalMax: number | null;

  // Put candidates table filters (mirror cross-entry: symbol / DTE / capital)
  writeDeskPutSymbol: string;
  writeDeskPutDteMin: number | null;
  writeDeskPutDteMax: number | null;
  writeDeskPutCapitalMin: number | null;
  writeDeskPutCapitalMax: number | null;

  // Buy-write candidates table symbol filter (mirror puts; empty = no filter)
  writeDeskBuyWriteSymbol: string;

  // Buy-write candidates table show count (null = "-" = all / unlimited)
  writeDeskBuyWriteShowCount: number | null;

  // Deployment table sort state
  writeDeskPutSortKey: string;
  writeDeskPutSortDir: string;
  writeDeskCallSortKey: string;
  writeDeskCallSortDir: string;
  writeDeskBuyWriteSortKey: string;
  writeDeskBuyWriteSortDir: string;
  writeDeskCrossEntrySortKey: string;
  writeDeskCrossEntrySortDir: string;

  // ── Scope 3: APPLICATION / OPERATOR CONTEXT (selection, not account-local) ──
  // Deployment portfolio source (LEGACY selection seam: "demo" | "fidelity").
  // Superseded by the active-account context below for multi-account selection; retained
  // for backward compatibility and demo-vs-fidelity distinction until Increment 8 cleanup.
  writeDeskSource: string;

  /**
   * Active BrokerageAccount selection (Increment 3) — durable operator preference, NOT
   * account-local. This is application/operator context: "which account am I operating on".
   * Null means no real account is selected (e.g. demo context, or nothing imported yet).
   * The active account is distinct from an account's identity; switching it reloads
   * account-local state without any import.
   */
  activeBrokerageAccountId: string | null;

  // ── Scope 4: GLOBAL MISSION (Situation Architecture primitive) ──
  /**
   * Monthly production target in dollars. Null = not configured. GLOBAL by Principal
   * resolution — NOT partitioned per BrokerageAccount in this phase. Do not add per-account
   * mission override machinery without an explicit Principal decision.
   */
  missionTarget: number | null;
}

const DEFAULT_WORKSPACE: Workspace = {
  writeDeskTargetDelta: 0.30,
  writeDeskTargetDte: 21,
  writeDeskRankingMode: "execution_first",
  writeDeskDeltaMin: 0.15,
  writeDeskDeltaMax: 0.50,
  writeDeskShowCount: null,
  writeDeskPutsCollapsed: false,
  writeDeskCallsCollapsed: false,
  writeDeskBuyWritesCollapsed: false,
  writeDeskCrossEntryCollapsed: false,
  writeDeskSectionOrder: ["cross-entry", "puts", "calls", "buy-writes"],
  writeDeskAffordableOnly: false,
  writeDeskShowDanger: false,
  writeDeskShowWideSpread: false,
  writeDeskCrossEntryAffordableOnly: false,
  writeDeskCrossEntryShowCount: null,
  writeDeskCrossEntryDteMin: null,
  writeDeskCrossEntryDteMax: null,
  writeDeskCrossEntrySymbol: "",
  writeDeskCrossEntryCapitalMin: null,
  writeDeskCrossEntryCapitalMax: null,
  writeDeskPutSymbol: "",
  writeDeskPutDteMin: null,
  writeDeskPutDteMax: null,
  writeDeskPutCapitalMin: null,
  writeDeskPutCapitalMax: null,
  writeDeskBuyWriteSymbol: "",
  writeDeskBuyWriteShowCount: null,
  writeDeskPutSortKey: "rank",
  writeDeskPutSortDir: "asc",
  writeDeskCallSortKey: "rank",
  writeDeskCallSortDir: "asc",
  writeDeskBuyWriteSortKey: "rank",
  writeDeskBuyWriteSortDir: "asc",
  writeDeskCrossEntrySortKey: "productionV0",
  writeDeskCrossEntrySortDir: "desc",
  writeDeskSource: "demo",
  activeBrokerageAccountId: null,
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
