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
import type { PortfolioSnapshot } from "../write-desk/types";
import { importFidelityEvidence, importEvidenceIntoAccount, getSnapshot } from "../portfolio/portfolio-store";
import type { ImportResolution, TargetedImportResult } from "../portfolio/account-import";
import { getAccountById } from "../portfolio/brokerage-account-registry";

/** Surface a non-refresh import outcome (generic path) as a hint on the balances slot. */
function surfaceResolution(
  resolution: ImportResolution,
  setBalSlot: React.Dispatch<React.SetStateAction<SlotState>>
): void {
  if (resolution.kind === "needs-assignment") {
    setBalSlot((s) => ({ ...s, error: "Account identity unresolved — assignment required.", status: s.status === "loaded" ? "loaded" : "error" }));
  } else if (resolution.kind === "conflict") {
    setBalSlot((s) => ({ ...s, error: `Files disagree on account (${resolution.refs.join(", ")}). Import refused.`, status: "error" }));
  }
  // "refreshed" / "empty": no additional hint needed.
}

/** Surface an account-targeted import outcome in plain operator language.
 *  Returns a notice string for outcomes that are informational (not errors), or null. */
function surfaceTargeted(
  result: TargetedImportResult,
  setBalSlot: React.Dispatch<React.SetStateAction<SlotState>>,
  activeAccountName: string,
): string | null {
  if (result.kind === "unidentified-balances") {
    setBalSlot((s) => ({ ...s, status: "error", error: "Wheelwright couldn't identify the Fidelity account in this file. The selected account was not changed." }));
    return null;
  }
  if (result.kind === "conflict" && result.reason === "files-disagree") {
    setBalSlot((s) => ({ ...s, status: "error", error: `These files disagree on the account (${result.refs.join(", ")}). Import refused.` }));
    return null;
  }
  if (result.kind === "routed-elsewhere") {
    // Ratified off-account behavior: the file identified a different known account; it was
    // refreshed there and the current selection is preserved. This is a NOTICE, not an error.
    const routedName = getAccountById(result.routedToBrokerageAccountId)?.displayName ?? "another account";
    return `${routedName} was refreshed. ${activeAccountName} remains selected.`;
  }
  // "refreshed" / "empty" / "unknown-target": no additional hint needed.
  return null;
}

type SlotStatus = "empty" | "parsing" | "loaded" | "error";

interface SlotState {
  status: SlotStatus;
  filename: string | null;
  error: string | null;
  timestamp: string | null;
}

interface Props {
  onSnapshotChange: (snapshot: PortfolioSnapshot | null) => void;
  /**
   * When provided, uploads target THIS account explicitly (account-targeted import with
   * fail-closed identity binding + ratified off-account routing). When omitted, uploads use
   * the generic account-aware resolver.
   */
  targetBrokerageAccountId?: string | null;
  /** Display name of the target/active account, for operator-facing routing notices. */
  targetAccountName?: string;
}

export function FidelityUploadCompact({ onSnapshotChange, targetBrokerageAccountId, targetAccountName }: Props) {
  const [osSlot, setOsSlot] = useState<SlotState>({ status: "empty", filename: null, error: null, timestamp: null });
  const [balSlot, setBalSlot] = useState<SlotState>({ status: "empty", filename: null, error: null, timestamp: null });
  const [actSlot, setActSlot] = useState<SlotState>({ status: "empty", filename: null, error: null, timestamp: null });
  const [notice, setNotice] = useState<string | null>(null);

  // Raw text blobs for the current in-progress import operation. Evidence is routed through
  // the account-aware importer (importFidelityEvidence), which resolves the account it
  // BELONGS to and writes that account's per-account slot — never the legacy singleton keys,
  // and never changing the active selection.
  const osBlobRef = useRef<{ text: string; filename: string } | null>(null);
  const balBlobRef = useRef<{ text: string; filename: string } | null>(null);
  const actBlobRef = useRef<{ text: string; filename: string } | null>(null);
  const osInputRef = useRef<HTMLInputElement>(null);
  const balInputRef = useRef<HTMLInputElement>(null);
  const actInputRef = useRef<HTMLInputElement>(null);

  // Validate CSV classification without persisting. Returns the export timestamp on success.
  const validateOs = useCallback((text: string): { ok: boolean; timestamp: string | null } => {
    try {
      const { csvContent, preambleLines } = preprocessCsv(text);
      const doc = parseCsv(csvContent, detectDelimiter(csvContent));
      const classification = classifyDocument(doc);
      if (!classification.parser || classification.parser.id !== "fidelity_option_summary") return { ok: false, timestamp: null };
      const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
      if (parsed.payload.type !== "option_summary") return { ok: false, timestamp: null };
      return { ok: true, timestamp: parsed.metadata.quoteDate ?? parsed.metadata.downloadTimestamp ?? null };
    } catch { return { ok: false, timestamp: null }; }
  }, []);

  const validateBal = useCallback((text: string): { ok: boolean; timestamp: string | null } => {
    try {
      const { csvContent, preambleLines } = preprocessCsv(text);
      const doc = parseCsv(csvContent, detectDelimiter(csvContent));
      const classification = classifyDocument(doc);
      if (!classification.parser || classification.parser.id !== "fidelity_balances") return { ok: false, timestamp: null };
      const parsed = classification.parser.parse(doc, { filename: "", preambleLines });
      if (parsed.payload.type !== "balances" || !parsed.payload.rows[0]) return { ok: false, timestamp: null };
      return { ok: true, timestamp: parsed.metadata.downloadTimestamp ?? null };
    } catch { return { ok: false, timestamp: null }; }
  }, []);

  const validateActivity = useCallback((text: string): boolean => {
    try {
      const { csvContent, preambleLines } = preprocessCsv(text);
      const doc = parseCsv(csvContent, detectDelimiter(csvContent));
      const classification = classifyDocument(doc);
      if (!classification.parser || classification.parser.id !== "fidelity_activity") return false;
      const parsed = classification.parser.parse(doc, { preambleLines });
      return parsed.payload.type === "activity";
    } catch { return false; }
  }, []);

  // Route the currently-loaded blobs through the appropriate importer and surface the
  // outcome. When targeting a specific account, use the account-targeted (fail-closed)
  // importer; otherwise the generic account-aware resolver.
  const runImport = useCallback((): void => {
    const op = {
      optionSummary: osBlobRef.current,
      balances: balBlobRef.current,
      activity: actBlobRef.current,
    };
    if (targetBrokerageAccountId) {
      const result = importEvidenceIntoAccount(targetBrokerageAccountId, op);
      const routedNotice = surfaceTargeted(result, setBalSlot, targetAccountName ?? "The current account");
      setNotice(routedNotice);
    } else {
      const resolution = importFidelityEvidence(op);
      surfaceResolution(resolution, setBalSlot);
      setNotice(null);
    }
    // The store publishes the active account's snapshot; mirror it to the caller so the
    // header/status updates. When a different account was refreshed the visible snapshot is
    // unchanged, which is the required behavior.
    onSnapshotChange(getSnapshot());
  }, [onSnapshotChange, targetBrokerageAccountId, targetAccountName]);

  const handleOsFile = useCallback(async (file: File) => {
    setOsSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    try {
      const text = await file.text();
      const v = validateOs(text);
      if (v.ok) {
        osBlobRef.current = { text, filename: file.name };
        setOsSlot({ status: "loaded", filename: file.name, error: null, timestamp: v.timestamp });
        runImport();
      } else {
        setOsSlot({ status: "error", filename: file.name, error: "Not a valid Option Summary CSV", timestamp: null });
      }
    } catch (err) {
      setOsSlot({ status: "error", filename: file.name, error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`, timestamp: null });
    }
  }, [validateOs, runImport]);

  const handleBalFile = useCallback(async (file: File) => {
    setBalSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    try {
      const text = await file.text();
      const v = validateBal(text);
      if (v.ok) {
        balBlobRef.current = { text, filename: file.name };
        setBalSlot({ status: "loaded", filename: file.name, error: null, timestamp: v.timestamp });
        runImport();
      } else {
        setBalSlot({ status: "error", filename: file.name, error: "Not a valid Balances CSV", timestamp: null });
      }
    } catch (err) {
      setBalSlot({ status: "error", filename: file.name, error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`, timestamp: null });
    }
  }, [validateBal, runImport]);

  const handleActFile = useCallback(async (file: File) => {
    setActSlot({ status: "parsing", filename: file.name, error: null, timestamp: null });
    try {
      const text = await file.text();
      if (validateActivity(text)) {
        actBlobRef.current = { text, filename: file.name };
        runImport();
        setActSlot({ status: "loaded", filename: file.name, error: null, timestamp: null });
      } else {
        setActSlot({ status: "error", filename: file.name, error: "Not a valid Activity CSV", timestamp: null });
      }
    } catch (err) {
      setActSlot({ status: "error", filename: file.name, error: `Parse error: ${err instanceof Error ? err.message : "unknown"}`, timestamp: null });
    }
  }, [validateActivity, runImport]);

  // Reflect the active account's already-loaded evidence (from store hydration) as slot
  // status on mount, so reopening the panel shows the current account's files.
  useEffect(() => {
    const snap = getSnapshot();
    if (snap && snap.source.type === "fidelity") {
      const osName = snap.provenance.optionSummaryFilename;
      const balName = snap.provenance.balancesFilename;
      if (osName) setOsSlot({ status: "loaded", filename: osName, error: null, timestamp: snap.provenance.optionSummaryExportTimestamp ?? null });
      if (balName) setBalSlot({ status: "loaded", filename: balName, error: null, timestamp: snap.provenance.balancesExportTimestamp ?? null });
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
      {notice && <div className="as-upload-notice" role="status">{notice}</div>}
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
    <div className={`as-upload-row-wrap as-upload-${slot.status}`}>
      <div className="as-upload-row">
        <span className="as-upload-slot-label">{label}</span>
        <span className="as-upload-slot-status">
          {slot.status === "loaded" && <span className="as-upload-ok">✓</span>}
          {slot.status === "error" && <span className="as-upload-err">✗</span>}
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
      {slot.status === "error" && slot.error && (
        <div className="as-upload-error-msg" role="alert">{slot.error}</div>
      )}
    </div>
  );
}
