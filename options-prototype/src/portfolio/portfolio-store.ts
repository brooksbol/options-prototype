/**
 * Application-Scoped Portfolio Store (ADR-011)
 *
 * Owns the current PortfolioSnapshot and import status.
 * Self-hydrates from localStorage on module load — before any component mounts.
 * Both the Operator Console and existing operational surface consume this shared state.
 *
 * This is NOT a generic application store. It owns Portfolio domain state only.
 */

import type { PortfolioSnapshot, PortfolioSourceType, SnapshotStatus } from "../write-desk/types";
import { buildFidelitySnapshot } from "../write-desk/fidelity-snapshot";
import { createDemoSnapshot } from "../write-desk/demo-snapshot";
import { loadWorkspace, updateWorkspace } from "../workspace/workspace";
import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../csv/fidelity/balancesParser";
import type { ActivityRow } from "../csv/fidelity/activityParser";
import { preprocessCsv } from "../csv/preprocess";
import { detectDelimiter, parseCsv } from "../csv/reader";
import { classifyDocument } from "../csv/registry";
import "../csv/fidelity"; // ensure parsers are registered before hydration
import { projectActivityOverlay, parseCheckpoint } from "./activity-projection";
import { derivePortfolioCapital } from "./portfolio-capital";
import { recordObservation } from "./portfolio-capital-history";
import {
  resolveImport,
  type ImportOperation,
  type ImportResolution,
} from "./account-import";
import { buildSnapshotForAccount } from "./account-snapshot";
import {
  migrateLegacySingletonEvidence,
  readAccountCsv,
} from "./account-evidence-store";
import {
  getActiveAccountContext,
  getActiveBrokerageAccountId,
  selectAccount as selectActiveAccount,
  selectDemo as selectActiveDemo,
} from "./active-account";
import { loadAccounts } from "./brokerage-account-registry";
import { migrateLegacyIntents } from "../execution/pending-intent";

// --- localStorage keys (shared with FidelityUpload for backward compat) ---

const LS_KEY_OS = "wheelwright:fidelity-csv:option-summary";
const LS_KEY_BAL = "wheelwright:fidelity-csv:balances";
const LS_KEY_ACTIVITY = "wheelwright:fidelity-csv:activity";

// --- Portfolio Capital Observation Recording ---

/**
 * Record a Portfolio Capital observation from a successfully built Fidelity snapshot.
 * Uses the Fidelity export timestamp as the observation time (when the data was true),
 * falling back to current time if no export timestamp is available.
 */
function recordPortfolioCapitalObservation(snapshot: PortfolioSnapshot): void {
  const derivation = derivePortfolioCapital(snapshot);
  if (!derivation) return;

  // The observation is keyed to TODAY (the day the operator imported).
  // Fidelity export timestamps are provenance — they tell us when the data was true,
  // but the trajectory point represents "I took a reading on this calendar day."
  const sourceTimestamp =
    snapshot.provenance?.balancesExportTimestamp ??
    snapshot.provenance?.optionSummaryExportTimestamp ??
    new Date().toISOString();

  recordObservation(sourceTimestamp, derivation.portfolioCapital, new Date());
}

// --- Import Status ---

export interface FileSlotInfo {
  filename: string;
  exportTimestamp: string | null;
  loadedAt: string;
}

export interface ImportStatus {
  optionSummary: FileSlotInfo | null;
  balances: FileSlotInfo | null;
  readinessStatus: SnapshotStatus | null;
  validationWarnings: string[];
}

// --- Store State ---

let currentSource: PortfolioSourceType = "demo";
let currentSnapshot: PortfolioSnapshot | null = null;
let currentImportStatus: ImportStatus = {
  optionSummary: null,
  balances: null,
  readinessStatus: null,
  validationWarnings: [],
};

// --- Subscription ---

type Listener = () => void;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// --- Accessors (for useSyncExternalStore) ---

export function getSnapshot(): PortfolioSnapshot | null {
  return currentSnapshot;
}

export function getSource(): PortfolioSourceType {
  return currentSource;
}

export function getImportStatus(): ImportStatus {
  return currentImportStatus;
}

export function getActivityRows(): ActivityRow[] | null {
  return currentActivityRows;
}

/**
 * Uploaded Activity CSV filename, if present in the existing workflow storage. Read-only,
 * no parsing/evidence machinery — used only as export source context (PL-PROD-EXPORT-01).
 */
export function getActivityFilename(): string | null {
  try {
    const stored = localStorage.getItem(LS_KEY_ACTIVITY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return typeof parsed?.filename === "string" ? parsed.filename : null;
  } catch {
    return null;
  }
}

// --- Mutations ---

export function setPortfolio(source: PortfolioSourceType, snapshot: PortfolioSnapshot | null): void {
  currentSource = source;
  currentSnapshot = snapshot;
  if (snapshot) {
    currentImportStatus = {
      ...currentImportStatus,
      readinessStatus: snapshot.readiness.status,
      validationWarnings: snapshot.readiness.warnings,
    };
    // Record Portfolio Capital observation for trajectory history
    if (source === "fidelity") {
      recordPortfolioCapitalObservation(snapshot);
    }
    // If Activity data exists, apply projection onto the new base snapshot
    if (currentActivityRows && source === "fidelity") {
      applyActivityProjection();
    }
  }
  updateWorkspace({ writeDeskSource: source });
  notify();
}

/**
 * Select the active portfolio source.
 *
 * - "demo": activates a demo snapshot immediately.
 * - "fidelity": reconstructs a Fidelity snapshot from persisted CSV data.
 *   If no persisted Fidelity data exists, snapshot becomes null.
 *
 * This is a declarative source selection — not a toggle primitive.
 */
export function selectPortfolioSource(source: PortfolioSourceType): void {
  if (source === "demo") {
    currentSource = "demo";
    currentSnapshot = createDemoSnapshot();
    updateWorkspace({ writeDeskSource: "demo" });
    notify();
    return;
  }

  // Fidelity: reconstruct from persisted CSV input
  currentSource = "fidelity";
  currentSnapshot = null;
  updateWorkspace({ writeDeskSource: "fidelity" });

  try {
    const osStored = localStorage.getItem(LS_KEY_OS);
    const balStored = localStorage.getItem(LS_KEY_BAL);

    if (osStored && balStored) {
      const { text: osText, filename: osFilename } = JSON.parse(osStored);
      const { text: balText, filename: balFilename } = JSON.parse(balStored);

      const osParsed = parseOptionSummaryText(osText);
      const balParsed = parseBalancesText(balText);

      if (osParsed && balParsed) {
        currentSnapshot = buildFidelitySnapshot({
          optionSummaryRows: osParsed.rows,
          optionSummaryFilename: osFilename,
          optionSummaryExportTimestamp: osParsed.exportTimestamp,
          balances: balParsed.balances,
          balancesFilename: balFilename,
          balancesExportTimestamp: balParsed.exportTimestamp,
        });
        currentImportStatus = {
          optionSummary: { filename: osFilename, exportTimestamp: osParsed.exportTimestamp, loadedAt: new Date().toISOString() },
          balances: { filename: balFilename, exportTimestamp: balParsed.exportTimestamp, loadedAt: new Date().toISOString() },
          readinessStatus: currentSnapshot.readiness.status,
          validationWarnings: currentSnapshot.readiness.warnings,
        };
      }
    }
  } catch {
    // Corrupt localStorage — snapshot remains null
  }

  notify();
}

export function setImportStatus(status: Partial<ImportStatus>): void {
  currentImportStatus = { ...currentImportStatus, ...status };
  notify();
}

// --- Account-aware live path (Increment 3 integration) ---
//
// These are the live seams that make the running application multi-account aware. Import
// resolves evidence to the account it BELONGS to (never changing the active selection);
// selection/switch loads that account's own account-local snapshot with no import. The
// read API (getSnapshot/getSource/getImportStatus/subscribe) is unchanged, so all existing
// consumers observe the active account's state transparently.

/**
 * When no account is selected and exactly one account exists in the registry, adopt it as
 * the active account (legacy single-account migration convenience). Returns the adopted id
 * or null. Never guesses when there are zero or multiple accounts.
 */
function adoptSoleAccountIfUnambiguous(): string | null {
  if (getActiveBrokerageAccountId() != null) return getActiveBrokerageAccountId();
  const accounts = loadAccounts().filter((a) => a.status === "active");
  if (accounts.length === 1) {
    const soleId = accounts[0].brokerageAccountId;
    selectActiveAccount(soleId);
    // Attribute any legacy account-blind pending intents to the sole account (Increment 4).
    // Idempotent, non-destructive, and only when unambiguous.
    migrateLegacyIntents(soleId);
    return soleId;
  }
  return null;
}

/** Load the active account's snapshot into the store and publish, or clear if none. */
function loadActiveAccountSnapshot(): void {
  const activeId = getActiveBrokerageAccountId();
  if (!activeId) {
    // No real account selected → nothing account-local to show on the fidelity path.
    currentSnapshot = null;
    currentImportStatus = { optionSummary: null, balances: null, readinessStatus: null, validationWarnings: [] };
    currentActivityRows = null;
    return;
  }

  const snapshot = buildSnapshotForAccount(activeId);
  currentSnapshot = snapshot;

  if (snapshot) {
    currentImportStatus = {
      optionSummary: snapshot.provenance.optionSummaryFilename
        ? { filename: snapshot.provenance.optionSummaryFilename, exportTimestamp: snapshot.provenance.optionSummaryExportTimestamp ?? null, loadedAt: new Date().toISOString() }
        : null,
      balances: snapshot.provenance.balancesFilename
        ? { filename: snapshot.provenance.balancesFilename, exportTimestamp: snapshot.provenance.balancesExportTimestamp ?? null, loadedAt: new Date().toISOString() }
        : null,
      readinessStatus: snapshot.readiness.status,
      validationWarnings: snapshot.readiness.warnings,
    };

    // Apply this account's own Activity overlay, if present.
    const actBlob = readAccountCsv(activeId, "activity");
    if (actBlob) {
      const actRows = parseActivityText(actBlob.text);
      currentActivityRows = actRows && actRows.length > 0 ? actRows : null;
      if (currentActivityRows) applyActivityProjection();
    } else {
      currentActivityRows = null;
    }
  } else {
    currentImportStatus = { optionSummary: null, balances: null, readinessStatus: null, validationWarnings: [] };
    currentActivityRows = null;
  }
}

/**
 * Switch the active BrokerageAccount and reload its account-local snapshot (Case E).
 * No import occurs; no other account is touched. Returns false if the id does not resolve.
 */
export function switchToAccount(brokerageAccountId: string): boolean {
  if (!selectActiveAccount(brokerageAccountId)) return false;
  currentSource = "fidelity";
  loadActiveAccountSnapshot();
  notify();
  return true;
}

/** Switch to the demo context (not a real account). */
export function switchToDemo(): void {
  selectActiveDemo();
  currentSource = "demo";
  currentSnapshot = createDemoSnapshot();
  currentActivityRows = null;
  notify();
}

/**
 * Import Fidelity evidence through the account-aware resolver (live upload path).
 *
 * Identity determines WHERE the evidence lands; this NEVER changes the active selection.
 * - Case A/B: evidence is written to the resolved account's slot. If the resolved account
 *   is the active one, the visible snapshot refreshes; if it is a different account, that
 *   account is refreshed while the active account (and visible snapshot) stays put.
 * - Case C: no resolvable identity → needs-assignment; nothing is attached to the active
 *   account.
 * - Case D: files disagree → conflict; nothing is written.
 *
 * Returns the resolution so the caller can surface Case B/C/D to the operator.
 */
export function importFidelityEvidence(op: ImportOperation): ImportResolution {
  const activeId = getActiveBrokerageAccountId();
  const resolution = resolveImport(op, activeId);

  if (resolution.kind !== "refreshed") {
    // Case C (needs-assignment), Case D (conflict), or empty: do not mutate visible state.
    return resolution;
  }

  // If this import created the very first account and nothing is selected yet, adopt it as
  // the active account (first-run convenience). This is NOT changing away from an existing
  // selection — it only selects when there was none.
  if (activeId == null && resolution.createdAccount && getActiveAccountContext().kind !== "account") {
    selectActiveAccount(resolution.brokerageAccountId);
  }

  // Refresh the VISIBLE snapshot only if the refreshed account is the active one.
  const nowActiveId = getActiveBrokerageAccountId();
  if (nowActiveId === resolution.brokerageAccountId) {
    currentSource = "fidelity";
    loadActiveAccountSnapshot();
    // Record a capital observation for the active account's fresh import.
    if (currentSnapshot) recordPortfolioCapitalObservation(currentSnapshot);
    notify();
  }
  // Else Case B: a different account was refreshed; active view is unchanged. No notify
  // needed for the visible snapshot, but listeners may still want registry-level updates.

  return resolution;
}

// --- Activity CSV ---

let currentActivityRows: ActivityRow[] | null = null;

/**
 * Persist and apply an Activity CSV.
 * Parses the text, stores it in localStorage, and rebuilds the snapshot with projection.
 */
export function setActivityCsv(text: string, filename: string): boolean {
  const parsed = parseActivityText(text);
  if (!parsed || parsed.length === 0) return false;

  currentActivityRows = parsed;
  localStorage.setItem(LS_KEY_ACTIVITY, JSON.stringify({ text, filename }));

  // Rebuild snapshot with projection if base snapshot exists
  if (currentSnapshot && currentSource === "fidelity") {
    applyActivityProjection();
  }

  notify();
  return true;
}

function parseActivityText(text: string): ActivityRow[] | null {
  try {
    const { csvContent, preambleLines } = preprocessCsv(text);
    const delimiter = detectDelimiter(csvContent);
    const doc = parseCsv(csvContent, delimiter);
    const classification = classifyDocument(doc);

    if (!classification.parser || classification.parser.id !== "fidelity_activity") return null;

    const parsed = classification.parser.parse(doc, { preambleLines });
    if (parsed.payload.type !== "activity") return null;

    return parsed.payload.rows as ActivityRow[];
  } catch {
    return null;
  }
}

/**
 * Apply Activity projection onto the current snapshot.
 * Called after both base snapshot and activity data are available.
 */
function applyActivityProjection(): void {
  if (!currentSnapshot || !currentActivityRows) return;

  const checkpointDate = currentSnapshot.provenance?.optionSummaryExportTimestamp ?? null;
  const checkpoint = parseCheckpoint(checkpointDate);

  const { snapshot: projected } = projectActivityOverlay(
    currentSnapshot,
    currentActivityRows,
    checkpoint.timestamp,
    checkpoint.precision,
  );

  currentSnapshot = projected;
}

// --- Hydration (runs once on module import) ---

function hydrate(): void {
  const savedSource = (loadWorkspace().writeDeskSource as PortfolioSourceType) || "demo";

  if (savedSource === "demo") {
    currentSource = "demo";
    currentSnapshot = createDemoSnapshot();
    return;
  }

  // Account-aware hydration (Increment 3 integration):
  // Migrate any legacy single-slot evidence into an account-keyed slot exactly once
  // (idempotent, non-destructive). Then, if an active account resolves, load its own
  // account-local snapshot. This is the live multi-account path.
  currentSource = "fidelity";
  try {
    migrateLegacySingletonEvidence();
    const ctx = getActiveAccountContext();
    if (ctx.kind === "account") {
      loadActiveAccountSnapshot();
      return;
    }
    // No active account selected yet. If migration produced exactly one account, adopt it
    // as the active account so the existing single-account operator sees their data without
    // re-import (Principal legacy-migration resolution).
    const migratedActiveId = adoptSoleAccountIfUnambiguous();
    if (migratedActiveId) {
      loadActiveAccountSnapshot();
      return;
    }
    // Otherwise fall through to the legacy singleton restore below (backward compatible).
  } catch {
    // Migration/registry failure must never break hydration — fall through to legacy.
  }

  try {
    const osStored = localStorage.getItem(LS_KEY_OS);
    const balStored = localStorage.getItem(LS_KEY_BAL);

    let osRows: OptionSummaryRow[] | null = null;
    let osFilename: string | null = null;
    let osTimestamp: string | null = null;

    let balances: ParsedBalances | null = null;
    let balFilename: string | null = null;
    let balTimestamp: string | null = null;

    if (osStored) {
      const { text, filename } = JSON.parse(osStored);
      const parsed = parseOptionSummaryText(text);
      if (parsed) {
        osRows = parsed.rows;
        osFilename = filename;
        osTimestamp = parsed.exportTimestamp;
        currentImportStatus.optionSummary = { filename, exportTimestamp: osTimestamp, loadedAt: new Date().toISOString() };
      }
    }

    if (balStored) {
      const { text, filename } = JSON.parse(balStored);
      const parsed = parseBalancesText(text);
      if (parsed) {
        balances = parsed.balances;
        balFilename = filename;
        balTimestamp = parsed.exportTimestamp;
        currentImportStatus.balances = { filename, exportTimestamp: balTimestamp, loadedAt: new Date().toISOString() };
      }
    }

    if (osRows && balances && osFilename && balFilename) {
      currentSnapshot = buildFidelitySnapshot({
        optionSummaryRows: osRows,
        optionSummaryFilename: osFilename,
        optionSummaryExportTimestamp: osTimestamp,
        balances,
        balancesFilename: balFilename,
        balancesExportTimestamp: balTimestamp,
      });
      currentImportStatus.readinessStatus = currentSnapshot.readiness.status;
      currentImportStatus.validationWarnings = currentSnapshot.readiness.warnings;

      // Hydration does NOT create a new daily observation.
      // Observations are created only by explicit operator import actions (setPortfolio).
      // This prevents opening the app from silently manufacturing trajectory points.

      // Restore Activity CSV and apply projection
      const actStored = localStorage.getItem(LS_KEY_ACTIVITY);
      if (actStored) {
        try {
          const { text: actText } = JSON.parse(actStored);
          const actRows = parseActivityText(actText);
          if (actRows && actRows.length > 0) {
            currentActivityRows = actRows;
            applyActivityProjection();
          }
        } catch { /* ignore corrupt activity data */ }
      }
    }
  } catch {
    // Corrupt localStorage — start empty
    currentSnapshot = null;
  }
}

// --- CSV Parsing Helpers (extracted from FidelityUpload) ---

function parseOptionSummaryText(text: string): { rows: OptionSummaryRow[]; exportTimestamp: string | null } | null {
  try {
    const { csvContent, preambleLines } = preprocessCsv(text);
    const delimiter = detectDelimiter(csvContent);
    const doc = parseCsv(csvContent, delimiter);
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_option_summary") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    if (parsed.payload.type !== "option_summary") return null;
    const rows = parsed.payload.rows as OptionSummaryRow[];
    const exportTimestamp = parsed.metadata.quoteDate ?? parsed.metadata.downloadTimestamp ?? null;
    return { rows, exportTimestamp };
  } catch {
    return null;
  }
}

function parseBalancesText(text: string): { balances: ParsedBalances; exportTimestamp: string | null } | null {
  try {
    const { csvContent, preambleLines } = preprocessCsv(text);
    const delimiter = detectDelimiter(csvContent);
    const doc = parseCsv(csvContent, delimiter);
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_balances") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    if (parsed.payload.type !== "balances" || !parsed.payload.rows[0]) return null;
    const balances = parsed.payload.rows[0] as unknown as ParsedBalances;
    const exportTimestamp = parsed.metadata.downloadTimestamp ?? null;
    return { balances, exportTimestamp };
  } catch {
    return null;
  }
}

// --- Self-hydrate on module load ---
hydrate();

// --- Test Support ---

/**
 * Reset store to a known state. Test-only — not for production use.
 */
export function _resetForTesting(): void {
  currentSource = "demo";
  currentSnapshot = null;
  currentActivityRows = null;
  currentImportStatus = {
    optionSummary: null,
    balances: null,
    readinessStatus: null,
    validationWarnings: [],
  };
  listeners.clear();
}

/**
 * Re-run the live hydration path after seeding localStorage. Test-only — lets integration
 * tests exercise the real startup path (migration + active-account load) deterministically.
 */
export function _rehydrateForTesting(): void {
  currentSource = "demo";
  currentSnapshot = null;
  currentActivityRows = null;
  currentImportStatus = { optionSummary: null, balances: null, readinessStatus: null, validationWarnings: [] };
  hydrate();
}
