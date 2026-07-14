/**
 * Fidelity Upload Panel — Two-file upload for the Write Desk.
 *
 * Provides two explicit file inputs (Option Summary + Balances),
 * classifies each uploaded file, validates it matches the expected slot,
 * and builds a PortfolioSnapshot when both are present and valid.
 */

import { useState, useCallback, useRef } from "react";
import { parseCsv, detectDelimiter } from "../csv/reader";
import { preprocessCsv } from "../csv/preprocess";
import { classifyDocument } from "../csv/registry";
import "../csv/fidelity"; // ensure parsers are registered
import type { OptionSummaryRow } from "../csv/fidelity/optionSummaryParser";
import type { ParsedBalances } from "../csv/fidelity/balancesParser";
import { buildFidelitySnapshot } from "../write-desk/fidelity-snapshot";
import type { PortfolioSnapshot } from "../write-desk/types";

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

  // Parsed data (kept in state so we can rebuild snapshot when either changes)
  const optionSummaryDataRef = useRef<{ rows: OptionSummaryRow[]; filename: string; exportTimestamp: string | null } | null>(null);
  const balancesDataRef = useRef<{ balances: ParsedBalances; filename: string; exportTimestamp: string | null } | null>(null);

  const osInputRef = useRef<HTMLInputElement>(null);
  const balInputRef = useRef<HTMLInputElement>(null);

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

  // Handle Option Summary upload
  const handleOptionSummaryFile = useCallback(async (file: File) => {
    setOptionSummarySlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    onFileChange();

    try {
      const text = await file.text();
      const { csvContent, preambleLines } = preprocessCsv(text);
      const delimiter = detectDelimiter(csvContent);
      const doc = parseCsv(csvContent, delimiter);
      const classification = classifyDocument(doc);

      // Validate it's the Option Summary
      if (!classification.parser || classification.parser.id !== "fidelity_option_summary") {
        const detected = classification.parser?.label ?? "Unknown document";
        setOptionSummarySlot({
          status: "error",
          filename: file.name,
          error: `This file was classified as "${detected}" — expected Fidelity Option Summary. Please upload the correct file.`,
          timestamp: null,
        });
        return;
      }

      // Parse
      const parsed = classification.parser.parse(doc, { filename: file.name, preambleLines });
      if (parsed.payload.type !== "option_summary") {
        setOptionSummarySlot({
          status: "error",
          filename: file.name,
          error: "Parser produced unexpected payload type.",
          timestamp: null,
        });
        return;
      }

      const rows = parsed.payload.rows as OptionSummaryRow[];
      const exportTimestamp = parsed.metadata.quoteDate ?? parsed.metadata.downloadTimestamp ?? null;

      optionSummaryDataRef.current = { rows, filename: file.name, exportTimestamp };
      setOptionSummarySlot({
        status: "loaded",
        filename: file.name,
        error: null,
        timestamp: exportTimestamp,
      });

      rebuildSnapshot();
    } catch (err) {
      setOptionSummarySlot({
        status: "error",
        filename: file.name,
        error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`,
        timestamp: null,
      });
    }
  }, [onFileChange, rebuildSnapshot]);

  // Handle Balances upload
  const handleBalancesFile = useCallback(async (file: File) => {
    setBalancesSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    onFileChange();

    try {
      const text = await file.text();
      const { csvContent, preambleLines } = preprocessCsv(text);
      const delimiter = detectDelimiter(csvContent);
      const doc = parseCsv(csvContent, delimiter);
      const classification = classifyDocument(doc);

      // Validate it's Balances
      if (!classification.parser || classification.parser.id !== "fidelity_balances") {
        const detected = classification.parser?.label ?? "Unknown document";
        setBalancesSlot({
          status: "error",
          filename: file.name,
          error: `This file was classified as "${detected}" — expected Fidelity Balances. Please upload the correct file.`,
          timestamp: null,
        });
        return;
      }

      // Parse
      const parsed = classification.parser.parse(doc, { filename: file.name, preambleLines });
      if (parsed.payload.type !== "balances" || !parsed.payload.rows[0]) {
        setBalancesSlot({
          status: "error",
          filename: file.name,
          error: "Could not extract balance data from this file.",
          timestamp: null,
        });
        return;
      }

      const balances = parsed.payload.rows[0] as unknown as ParsedBalances;
      const exportTimestamp = parsed.metadata.downloadTimestamp ?? null;

      balancesDataRef.current = { balances, filename: file.name, exportTimestamp };
      setBalancesSlot({
        status: "loaded",
        filename: file.name,
        error: null,
        timestamp: exportTimestamp,
      });

      rebuildSnapshot();
    } catch (err) {
      setBalancesSlot({
        status: "error",
        filename: file.name,
        error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`,
        timestamp: null,
      });
    }
  }, [onFileChange, rebuildSnapshot]);

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
