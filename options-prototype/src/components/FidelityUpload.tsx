/**
 * Fidelity Upload Panel — Two-file upload for the Write Desk.
 *
 * Provides two explicit file inputs (Option Summary + Balances),
 * classifies each uploaded file, validates it matches the expected slot,
 * and builds a PortfolioSnapshot when both are present and valid.
 *
 * PERSISTENCE: Uploaded CSV text is stored in localStorage so the snapshot
 * survives route navigation and page reloads without re-uploading.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { parseCsv, detectDelimiter } from "../csv/reader";
import { preprocessCsv } from "../csv/preprocess";
import { classifyDocument } from "../csv/registry";
import "../csv/fidelity"; // ensure parsers are registered
import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../csv/fidelity/balancesParser";
import { buildFidelitySnapshot } from "../write-desk/fidelity-snapshot";
import type { PortfolioSnapshot } from "../write-desk/types";

// --- localStorage keys ---

const LS_KEY_OS = "wheelwright:fidelity-csv:option-summary";
const LS_KEY_BAL = "wheelwright:fidelity-csv:balances";

// --- Slot State ---

export type SlotStatus = "empty" | "parsing" | "loaded" | "error";

export interface FileSlotState {
  status: SlotStatus;
  filename: string | null;
  error: string | null;
  timestamp: string | null;
}

interface FidelityUploadProps {
  onSnapshotChange: (snapshot: PortfolioSnapshot | null) => void;
  /** Called when either file changes, to invalidate prior scan results */
  onFileChange: () => void;
}

// --- Component ---

export function FidelityUpload({ onSnapshotChange, onFileChange }: FidelityUploadProps) {
  const [optionSummarySlot, setOptionSummarySlot] = useState<FileSlotState>({ status: "empty", filename: null, error: null, timestamp: null });
  const [balancesSlot, setBalancesSlot] = useState<FileSlotState>({ status: "empty", filename: null, error: null, timestamp: null });

  // Parsed data (kept in refs so we can rebuild snapshot when either changes)
  const optionSummaryDataRef = useRef<{ rows: OptionSummaryRow[]; filename: string; exportTimestamp: string | null } | null>(null);
  const balancesDataRef = useRef<{ balances: ParsedBalances; filename: string; exportTimestamp: string | null } | null>(null);

  const osInputRef = useRef<HTMLInputElement>(null);
  const balInputRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);

  // Attempt to rebuild the snapshot from current data
  const rebuildSnapshot = useCallback(() => {
    const osData = optionSummaryDataRef.current;
    const balData = balancesDataRef.current;

    if (osData && balData) {
      const snapshot = buildFidelitySnapshot({
        optionSummaryRows: osData.rows,
        optionSummaryFilename: osData.filename,
        optionSummaryExportTimestamp: osData.exportTimestamp,
        balances: balData.balances,
        balancesFilename: balData.filename,
        balancesExportTimestamp: balData.exportTimestamp,
      });
      onSnapshotChange(snapshot);
    } else {
      onSnapshotChange(null);
    }
  }, [onSnapshotChange]);

  // --- Shared text processing (used by both fresh upload and localStorage restore) ---

  const processOptionSummaryText = useCallback((text: string, filename: string): boolean => {
    try {
      const { csvContent, preambleLines } = preprocessCsv(text);
      const delimiter = detectDelimiter(csvContent);
      const doc = parseCsv(csvContent, delimiter);
      const classification = classifyDocument(doc);

      if (!classification.parser || classification.parser.id !== "fidelity_option_summary") {
        return false;
      }

      const parsed = classification.parser.parse(doc, { filename, preambleLines });
      if (parsed.payload.type !== "option_summary") return false;

      const rows = parsed.payload.rows as OptionSummaryRow[];
      const exportTimestamp = parsed.metadata.quoteDate ?? parsed.metadata.downloadTimestamp ?? null;

      optionSummaryDataRef.current = { rows, filename, exportTimestamp };
      setOptionSummarySlot({ status: "loaded", filename, error: null, timestamp: exportTimestamp });
      return true;
    } catch {
      return false;
    }
  }, []);

  const processBalancesText = useCallback((text: string, filename: string): boolean => {
    try {
      const { csvContent, preambleLines } = preprocessCsv(text);
      const delimiter = detectDelimiter(csvContent);
      const doc = parseCsv(csvContent, delimiter);
      const classification = classifyDocument(doc);

      if (!classification.parser || classification.parser.id !== "fidelity_balances") {
        return false;
      }

      const parsed = classification.parser.parse(doc, { filename, preambleLines });
      if (parsed.payload.type !== "balances" || !parsed.payload.rows[0]) return false;

      const balances = parsed.payload.rows[0] as unknown as ParsedBalances;
      const exportTimestamp = parsed.metadata.downloadTimestamp ?? null;

      balancesDataRef.current = { balances, filename, exportTimestamp };
      setBalancesSlot({ status: "loaded", filename, error: null, timestamp: exportTimestamp });
      return true;
    } catch {
      return false;
    }
  }, []);

  // --- Restore from localStorage on mount ---

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    let restored = false;
    try {
      const osStored = localStorage.getItem(LS_KEY_OS);
      const balStored = localStorage.getItem(LS_KEY_BAL);

      if (osStored) {
        const { text, filename } = JSON.parse(osStored);
        if (processOptionSummaryText(text, filename)) restored = true;
      }
      if (balStored) {
        const { text, filename } = JSON.parse(balStored);
        if (processBalancesText(text, filename)) restored = true;
      }
    } catch {
      // Silently ignore corrupt localStorage
    }

    if (restored) {
      // Rebuild after both are processed
      setTimeout(() => rebuildSnapshot(), 0);
    }
  }, [processOptionSummaryText, processBalancesText, rebuildSnapshot]);

  // --- Handle fresh Option Summary upload ---

  const handleOptionSummaryFile = useCallback(async (file: File) => {
    setOptionSummarySlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    onFileChange();

    try {
      const text = await file.text();

      if (processOptionSummaryText(text, file.name)) {
        // Persist raw CSV text for restoration
        localStorage.setItem(LS_KEY_OS, JSON.stringify({ text, filename: file.name }));
        rebuildSnapshot();
      } else {
        setOptionSummarySlot({
          status: "error",
          filename: file.name,
          error: "Could not classify as Fidelity Option Summary. Please upload the correct file.",
          timestamp: null,
        });
      }
    } catch (err) {
      setOptionSummarySlot({
        status: "error",
        filename: file.name,
        error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`,
        timestamp: null,
      });
    }
  }, [onFileChange, processOptionSummaryText, rebuildSnapshot]);

  // --- Handle fresh Balances upload ---

  const handleBalancesFile = useCallback(async (file: File) => {
    setBalancesSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    onFileChange();

    try {
      const text = await file.text();

      if (processBalancesText(text, file.name)) {
        // Persist raw CSV text for restoration
        localStorage.setItem(LS_KEY_BAL, JSON.stringify({ text, filename: file.name }));
        rebuildSnapshot();
      } else {
        setBalancesSlot({
          status: "error",
          filename: file.name,
          error: "Could not classify as Fidelity Balances. Please upload the correct file.",
          timestamp: null,
        });
      }
    } catch (err) {
      setBalancesSlot({
        status: "error",
        filename: file.name,
        error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`,
        timestamp: null,
      });
    }
  }, [onFileChange, processBalancesText, rebuildSnapshot]);

  return (
    <div className="wd-fidelity-upload">
      <div className="wd-upload-header">
        <h3 className="wd-upload-title">Fidelity Portfolio Snapshot</h3>
        <p className="wd-upload-hint">Upload both CSV exports to enable the operational write list.</p>
      </div>

      <div className="wd-upload-slots">
        {/* Option Summary Slot */}
        <div className={`wd-upload-slot wd-slot-${optionSummarySlot.status}`}>
          <div className="wd-slot-header">
            <span className="wd-slot-label">Option Summary</span>
            <span className="wd-slot-description">Inventory, open options, and covered-call encumbrances</span>
          </div>
          <div className="wd-slot-controls">
            <input
              ref={osInputRef}
              type="file"
              accept=".csv"
              className="wd-file-input-hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleOptionSummaryFile(file);
                e.target.value = ""; // allow re-upload of same file
              }}
            />
            <button
              className="wd-upload-btn"
              onClick={() => osInputRef.current?.click()}
            >
              {optionSummarySlot.status === "loaded" ? "Replace" : "Choose CSV"}
            </button>
            <SlotStatusBadge slot={optionSummarySlot} />
          </div>
          {optionSummarySlot.error && (
            <p className="wd-slot-error">{optionSummarySlot.error}</p>
          )}
        </div>

        {/* Balances Slot */}
        <div className={`wd-upload-slot wd-slot-${balancesSlot.status}`}>
          <div className="wd-slot-header">
            <span className="wd-slot-label">Balances</span>
            <span className="wd-slot-description">Available to Trade, All Settled and account balance context</span>
          </div>
          <div className="wd-slot-controls">
            <input
              ref={balInputRef}
              type="file"
              accept=".csv"
              className="wd-file-input-hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBalancesFile(file);
                e.target.value = "";
              }}
            />
            <button
              className="wd-upload-btn"
              onClick={() => balInputRef.current?.click()}
            >
              {balancesSlot.status === "loaded" ? "Replace" : "Choose CSV"}
            </button>
            <SlotStatusBadge slot={balancesSlot} />
          </div>
          {balancesSlot.error && (
            <p className="wd-slot-error">{balancesSlot.error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Status Badge ---

function SlotStatusBadge({ slot }: { slot: FileSlotState }) {
  if (slot.status === "empty") {
    return <span className="wd-slot-status wd-slot-status-empty">Not loaded</span>;
  }
  if (slot.status === "parsing") {
    return <span className="wd-slot-status wd-slot-status-parsing">Parsing...</span>;
  }
  if (slot.status === "error") {
    return <span className="wd-slot-status wd-slot-status-error">Error</span>;
  }
  // loaded
  return (
    <span className="wd-slot-status wd-slot-status-loaded">
      {slot.filename}{slot.timestamp ? ` · ${slot.timestamp}` : ""}
    </span>
  );
}
