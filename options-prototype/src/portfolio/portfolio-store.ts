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
import { preprocessCsv } from "../csv/preprocess";
import { detectDelimiter, parseCsv } from "../csv/reader";
import { classifyDocument } from "../csv/registry";

// --- localStorage keys (shared with FidelityUpload for backward compat) ---

const LS_KEY_OS = "wheelwright:fidelity-csv:option-summary";
const LS_KEY_BAL = "wheelwright:fidelity-csv:balances";

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

// --- Hydration (runs once on module import) ---

function hydrate(): void {
  const savedSource = (loadWorkspace().writeDeskSource as PortfolioSourceType) || "demo";

  if (savedSource === "demo") {
    currentSource = "demo";
    currentSnapshot = createDemoSnapshot();
    return;
  }

  // Attempt Fidelity restore from localStorage
  currentSource = "fidelity";

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
  currentImportStatus = {
    optionSummary: null,
    balances: null,
    readinessStatus: null,
    validationWarnings: [],
  };
  listeners.clear();
}
