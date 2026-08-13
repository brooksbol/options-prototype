/**
 * Fidelity Upload Compact — Minimal upload controls for the header dropdown.
 *
 * Three file slots rendered as compact rows with status indicators.
 * Reuses the same localStorage persistence + parsing as the original FidelityUpload.
 *
 * This is the application-level upload surface. Individual pages no longer
 * need their own upload panels.
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
import { setActivityCsv } from "../portfolio/portfolio-store";

// localStorage keys (shared with portfolio-store for backward compat)
const LS_KEY_OS = "wheelwright:fidelity-csv:option-summary";
const LS_KEY_BAL = "wheelwright:fidelity-csv:balances";
const LS_KEY_ACTIVITY = "wheelwright:fidelity-csv:activity";

type SlotStatus = "empty" | "parsing" | "loaded" | "error";

interface SlotState {
  status: SlotStatus;
  filename: string | null;
  error: string | null;
  timestamp: string | null;
}

interface Props {
  onSnapshotChange: (snapshot: PortfolioSnapshot | null) => void;
}

export function FidelityUploadCompact({ onSnapshotChange }: Props) {
  const [osSlot, setOsSlot] = useState<SlotState>({ status: "empty", filename: null, error: null, timestamp: null });
  const [balSlot, setBalSlot] = useState<SlotState>({ status: "empty", filename: null, error: null, timestamp: null });
  const [actSlot, setActSlot] = useState<SlotState>({ status: "empty", filename: null, error: null, timestamp: null });

  const osDataRef = useRef<{ rows: OptionSummaryRow[]; filename: string; exportTimestamp: string | null } | null>(null);
  const balDataRef = useRef<{ balances: ParsedBalances; filename: string; exportTimestamp: string | null } | null>(null);
  const osInputRef = useRef<HTMLInputElement>(null);
  const balInputRef = useRef<HTMLInputElement>(null);
  const actInputRef = useRef<HTMLInputElement>(null);
  const restoredRef = useRef(false);

  const rebuildSnapshot = useCallback(() => {
    const os = osDataRef.current;
    const bal = balDataRef.current;
    if (os && bal) {
      const snapshot = buildFidelitySnapshot({
        optionSummaryRows: os.rows,
        optionSummaryFilename: os.filename,
        optionSummaryExportTimestamp: os.exportTimestamp,
        balances: bal.balances,
        balancesFilename: bal.filename,
        balancesExportTimestamp: bal.exportTimestamp,
      });
      onSnapshotChange(snapshot);
    } else {
      onSnapshotChange(null);
    }
  }, [onSnapshotChange]);

  const processOsText = useCallback((text: string, filename: string): boolean => {
    try {
      const { csvContent, preambleLines } = preprocessCsv(text);
      const delimiter = detectDelimiter(csvContent);
      const doc = parseCsv(csvContent, delimiter);
      const classification = classifyDocument(doc);
      if (!classification.parser || classification.parser.id !== "fidelity_option_summary") return false;
      const parsed = classification.parser.parse(doc, { filename, preambleLines });
      if (parsed.payload.type !== "option_summary") return false;
      const rows = parsed.payload.rows as OptionSummaryRow[];
      const exportTimestamp = parsed.metadata.quoteDate ?? parsed.metadata.downloadTimestamp ?? null;
      osDataRef.current = { rows, filename, exportTimestamp };
      setOsSlot({ status: "loaded", filename, error: null, timestamp: exportTimestamp });
      return true;
    } catch { return false; }
  }, []);

  const processBalText = useCallback((text: string, filename: string): boolean => {
    try {
      const { csvContent, preambleLines } = preprocessCsv(text);
      const delimiter = detectDelimiter(csvContent);
      const doc = parseCsv(csvContent, delimiter);
      const classification = classifyDocument(doc);
      if (!classification.parser || classification.parser.id !== "fidelity_balances") return false;
      const parsed = classification.parser.parse(doc, { filename, preambleLines });
      if (parsed.payload.type !== "balances" || !parsed.payload.rows[0]) return false;
      const balances = parsed.payload.rows[0] as unknown as ParsedBalances;
      const exportTimestamp = parsed.metadata.downloadTimestamp ?? null;
      balDataRef.current = { balances, filename, exportTimestamp };
      setBalSlot({ status: "loaded", filename, error: null, timestamp: exportTimestamp });
      return true;
    } catch { return false; }
  }, []);

  // Restore from localStorage on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    let restored = false;
    try {
      const osStored = localStorage.getItem(LS_KEY_OS);
      const balStored = localStorage.getItem(LS_KEY_BAL);
      const actStored = localStorage.getItem(LS_KEY_ACTIVITY);
      if (osStored) {
        const { text, filename } = JSON.parse(osStored);
        if (processOsText(text, filename)) restored = true;
      }
      if (balStored) {
        const { text, filename } = JSON.parse(balStored);
        if (processBalText(text, filename)) restored = true;
      }
      if (actStored) {
        const { filename } = JSON.parse(actStored);
        setActSlot({ status: "loaded", filename, error: null, timestamp: null });
      }
    } catch { /* ignore */ }
    if (restored) setTimeout(() => rebuildSnapshot(), 0);
  }, [processOsText, processBalText, rebuildSnapshot]);

  const handleOsFile = useCallback(async (file: File) => {
    setOsSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    try {
      const text = await file.text();
      if (processOsText(text, file.name)) {
        localStorage.setItem(LS_KEY_OS, JSON.stringify({ text, filename: file.name }));
        rebuildSnapshot();
      } else {
        setOsSlot({ status: "error", filename: file.name, error: "Not a valid Option Summary CSV", timestamp: null });
      }
    } catch (err) {
      setOsSlot({ status: "error", filename: file.name, error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`, timestamp: null });
    }
  }, [processOsText, rebuildSnapshot]);

  const handleBalFile = useCallback(async (file: File) => {
    setBalSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    try {
      const text = await file.text();
      if (processBalText(text, file.name)) {
        localStorage.setItem(LS_KEY_BAL, JSON.stringify({ text, filename: file.name }));
        rebuildSnapshot();
      } else {
        setBalSlot({ status: "error", filename: file.name, error: "Not a valid Balances CSV", timestamp: null });
      }
    } catch (err) {
      setBalSlot({ status: "error", filename: file.name, error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`, timestamp: null });
    }
  }, [processBalText, rebuildSnapshot]);

  const handleActFile = useCallback(async (file: File) => {
    setActSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    try {
      const text = await file.text();
      if (setActivityCsv(text, file.name)) {
        setActSlot({ status: "loaded", filename: file.name, error: null, timestamp: null });
      } else {
        setActSlot({ status: "error", filename: file.name, error: "Not a valid Activity CSV", timestamp: null });
      }
    } catch (err) {
      setActSlot({ status: "error", filename: file.name, error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`, timestamp: null });
    }
  }, []);

  return (
    <div className="as-upload-compact">
      <UploadRow
        label="Option Summary"
        slot={osSlot}
        inputRef={osInputRef}
        onFile={handleOsFile}
      />
      <UploadRow
        label="Balances"
        slot={balSlot}
        inputRef={balInputRef}
        onFile={handleBalFile}
      />
      <UploadRow
        label="Activity"
        slot={actSlot}
        inputRef={actInputRef}
        onFile={handleActFile}
      />
    </div>
  );
}

function UploadRow({ label, slot, inputRef, onFile }: {
  label: string;
  slot: SlotState;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File) => void;
}) {
  return (
    <div className={`as-upload-row as-upload-${slot.status}`}>
      <span className="as-upload-slot-label">{label}</span>
      <span className="as-upload-slot-status">
        {slot.status === "loaded" && <span className="as-upload-ok">✓</span>}
        {slot.status === "error" && <span className="as-upload-err" title={slot.error ?? undefined}>✗</span>}
        {slot.status === "loaded" && slot.filename && (
          <span className="as-upload-filename" title={slot.filename}>
            {slot.filename.length > 18 ? slot.filename.slice(0, 15) + "…" : slot.filename}
          </span>
        )}
        {slot.status === "empty" && <span className="as-upload-empty">—</span>}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="as-upload-input-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <button
        className="as-upload-btn"
        onClick={() => inputRef.current?.click()}
      >
        {slot.status === "loaded" ? "↻" : "⬆"}
      </button>
    </div>
  );
}
