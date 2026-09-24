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
import type { HoldingRow } from "../csv/fidelity/positionsParser";
import { deriveOwnershipFromPositions } from "./positions-ownership";
import { preprocessCsv } from "../csv/preprocess";
import { detectDelimiter, parseCsv } from "../csv/reader";
import { classifyDocument } from "../csv/registry";
import "../csv/fidelity"; // ensure parsers are registered before hydration
import { projectActivityOverlay, parseCheckpoint } from "./activity-projection";
import { derivePortfolioCapital } from "./portfolio-capital";
import { recordObservation, migrateLegacyHistoryToAccount } from "./portfolio-capital-history";
import {
  resolveImport,
  importIntoAccount,
  type ImportOperation,
  type ImportResolution,
  type TargetedImportResult,
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
  clearActiveAccount as clearActiveAccountSelection,
} from "./active-account";
import {
  loadAccounts,
  registerAccount,
  updateAccount,
} from "./brokerage-account-registry";
import type { BrokerageAccount } from "./brokerage-account";
import { migrateLegacyIntents } from "../execution/pending-intent";
import { migrateLegacyOutlookToAccount } from "../forecast/outlook-observations";

// --- localStorage keys (shared with FidelityUpload for backward compat) ---

const LS_KEY_OS = "wheelwright:fidelity-csv:option-summary";
const LS_KEY_POSITIONS = "wheelwright:fidelity-csv:positions";
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

  // Record under the account the snapshot belongs to (Increment 5). Demo/unattributed
  // snapshots (null) record into the legacy global series.
  recordObservation(sourceTimestamp, derivation.portfolioCapital, new Date(), snapshot.brokerageAccountId ?? null);
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
 * The ACTIVE account's Activity CSV blob (Increment 7), or the legacy global blob when the
 * context is demo/unattributed. Production assessment must be fed the active account's own
 * activity so account A's realized activity can never be assessed as account B's. Read-only.
 */
function getActiveActivityBlob(): { text: string; filename: string } | null {
  const activeId = getActiveBrokerageAccountId();
  if (activeId) {
    return readAccountCsv(activeId, "activity");
  }
  // Demo/unattributed: fall back to the legacy global slot.
  try {
    const stored = localStorage.getItem(LS_KEY_ACTIVITY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (typeof parsed?.text === "string" && typeof parsed?.filename === "string") {
      return { text: parsed.text, filename: parsed.filename };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * The ACTIVE account's raw Activity CSV text, for feeding Production assessment
 * (POST /api/production/assess). Account-scoped (Increment 7). Null when no activity exists.
 */
export function getActiveAccountActivityText(): string | null {
  return getActiveActivityBlob()?.text ?? null;
}

/**
 * The ACTIVE account's Activity CSV filename (Increment 7), or the legacy global filename
 * for the demo/unattributed context. Read-only; used only as export source context
 * (PL-PROD-EXPORT-01).
 */
export function getActivityFilename(): string | null {
  return getActiveActivityBlob()?.filename ?? null;
}

/**
 * The ACTIVE account's persisted Positions CSV blob (ADR-020), or the legacy global blob
 * for the demo/unattributed context. Read-only. Used to reconstruct upload-slot status
 * (BUG-027-class asymmetry) so a durably-persisted Positions file is not shown as absent.
 */
function getActivePositionsBlob(): { text: string; filename: string } | null {
  const activeId = getActiveBrokerageAccountId();
  if (activeId) {
    return readAccountCsv(activeId, "positions");
  }
  try {
    const stored = localStorage.getItem(LS_KEY_POSITIONS);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (typeof parsed?.text === "string" && typeof parsed?.filename === "string") {
      return { text: parsed.text, filename: parsed.filename };
    }
    return null;
  } catch {
    return null;
  }
}

/** The ACTIVE account's Positions CSV filename, or null. Read-only (slot-status reconstruction). */
export function getPositionsFilename(): string | null {
  return getActivePositionsBlob()?.filename ?? null;
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

  // Fidelity: load the ACTIVE account's snapshot via the account-aware path (Increment 8).
  // Previously this rebuilt from the legacy singleton keys, which was an account-blind path
  // that could show stale/wrong evidence once multiple accounts exist. Now it migrates any
  // legacy evidence once, resolves/adopts the active account, and loads that account's own
  // account-local snapshot.
  currentSource = "fidelity";
  updateWorkspace({ writeDeskSource: "fidelity" });

  try {
    migrateLegacySingletonEvidence();
    if (getActiveAccountContext().kind !== "account") {
      adoptSoleAccountIfUnambiguous();
    }
    loadActiveAccountSnapshot();
  } catch {
    // Registry/evidence failure — leave snapshot cleared rather than showing wrong data.
    currentSnapshot = null;
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
    // Attribute legacy account-blind state to the sole account (Increments 4 & 5).
    // All idempotent, non-destructive, and only when unambiguous.
    migrateLegacyIntents(soleId);
    migrateLegacyHistoryToAccount(soleId);
    migrateLegacyOutlookToAccount(soleId);
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

// --- Operator account management (explicit-account workflow, follow-on) ---
//
// The Portfolio dropdown is the lightweight account-management surface: add / select /
// upload-refresh / remove / rename — all account-local, no separate screen. Accounts are
// created explicitly by the operator; external Fidelity identity is bound later by the
// first unambiguous import (importIntoAccount), never fabricated.

/**
 * Create a new BrokerageAccount explicitly with an operator display name (no CSV required).
 * Returns the created account. The account has stable Wheelwright identity immediately but
 * no external Fidelity reference and no evidence until CSVs are imported into it.
 */
export function createAccount(displayName: string): BrokerageAccount {
  const reg = registerAccount({ broker: "fidelity", displayName: displayName.trim() || null });
  // A fresh anonymous account is always "created" (null refs never coalesce).
  const account = reg.kind === "ambiguous" ? reg.matches[0] : reg.account;
  notify();
  return account;
}

/** Rename an account (display only). Never changes identity, external ref, or evidence. */
export function renameAccount(brokerageAccountId: string, displayName: string): void {
  const name = displayName.trim();
  if (!name) return;
  updateAccount(brokerageAccountId, { displayName: name });
  notify();
}

/**
 * Remove (archive) an account. Soft, reversible at the domain level: the account is marked
 * archived so it no longer appears in the active list, but its evidence is not destroyed and
 * no OTHER account is touched. If the removed account was active, the app is left in an
 * explicit safe state: switch to the sole remaining account if exactly one remains, else
 * clear to "none" (never silently masquerade another account as the removed one).
 */
export function removeAccount(brokerageAccountId: string): void {
  const wasActive = getActiveBrokerageAccountId() === brokerageAccountId;
  updateAccount(brokerageAccountId, { status: "archived" });

  if (wasActive) {
    // Explicit safe state (ratified): removing the ACTIVE account must NOT silently
    // substitute another BrokerageAccount — that would change financial context without an
    // operator decision. Enter a no-active-account state; the operator then deliberately
    // selects the next account. Demo is not silently selected either.
    clearActiveAccountSelection();
    currentSource = "fidelity";
    currentSnapshot = null;
    currentImportStatus = { optionSummary: null, balances: null, readinessStatus: null, validationWarnings: [] };
    currentActivityRows = null;
    notify();
  } else {
    // Removing an inactive account leaves the active account unchanged.
    notify();
  }
}

/**
 * Import Fidelity CSVs INTO a specific account (the explicit-account upload workflow).
 *
 * Selection is the sole identity authority: the operator's chosen target IS the identity
 * decision. Structurally-valid evidence is written straight into that account (no
 * account-number check, no identity refusals, no cross-account routing). Refreshes the
 * visible snapshot when the target is the active account.
 */
export function importEvidenceIntoAccount(
  brokerageAccountId: string,
  op: ImportOperation,
): TargetedImportResult {
  const result = importIntoAccount(op, brokerageAccountId);

  if (result.kind === "refreshed" && getActiveBrokerageAccountId() === brokerageAccountId) {
    currentSource = "fidelity";
    loadActiveAccountSnapshot();
    if (currentSnapshot) recordPortfolioCapitalObservation(currentSnapshot);
    notify();
  }
  return result;
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
  } else {
    // Case B: a DIFFERENT account was refreshed; the active view is unchanged. Still record
    // that account's own capital observation (importing its CSVs IS taking a reading of it),
    // under its own account-local trajectory — never the active account's.
    const refreshedSnapshot = buildSnapshotForAccount(resolution.brokerageAccountId);
    if (refreshedSnapshot) recordPortfolioCapitalObservation(refreshedSnapshot);
  }

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
      // Positions is authoritative for aggregate share ownership WHEN AVAILABLE (ADR-020).
      // Legacy singleton parity with the account-keyed path (account-snapshot.ts).
      let posOwnership: Map<string, number> | null = null;
      let posFilename: string | null = null;
      let posTimestamp: string | null = null;
      const posStored = localStorage.getItem(LS_KEY_POSITIONS);
      if (posStored) {
        try {
          const { text: posText, filename } = JSON.parse(posStored);
          const parsedPos = parsePositionsText(posText);
          if (parsedPos) {
            posOwnership = parsedPos.ownership;
            posFilename = filename;
            posTimestamp = parsedPos.exportTimestamp;
          }
        } catch { /* ignore corrupt positions data */ }
      }

      currentSnapshot = buildFidelitySnapshot({
        optionSummaryRows: osRows,
        optionSummaryFilename: osFilename,
        optionSummaryExportTimestamp: osTimestamp,
        balances,
        balancesFilename: balFilename,
        balancesExportTimestamp: balTimestamp,
        authoritativeOwnership: posOwnership,
        positionsFilename: posFilename,
        positionsExportTimestamp: posTimestamp,
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

/**
 * Parse a Positions CSV into authoritative aggregate ownership (ADR-020). Legacy singleton
 * parity with account-snapshot.ts. Returns null when missing/unparseable/empty.
 */
function parsePositionsText(
  text: string
): { ownership: Map<string, number>; exportTimestamp: string | null } | null {
  try {
    const { csvContent, preambleLines } = preprocessCsv(text);
    const delimiter = detectDelimiter(csvContent);
    const doc = parseCsv(csvContent, delimiter);
    const classification = classifyDocument(doc);
    if (!classification.parser || classification.parser.id !== "fidelity_positions") return null;
    const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
    if (parsed.payload.type !== "holdings") return null;
    const ownership = deriveOwnershipFromPositions(parsed.payload.rows as HoldingRow[]);
    if (ownership.size === 0) return null;
    const exportTimestamp = parsed.metadata.downloadTimestamp ?? null;
    return { ownership, exportTimestamp };
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
