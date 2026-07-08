/**
 * CSV Document Classifier and Parser Registry.
 *
 * Each parser registers itself with:
 *   - id: unique identifier
 *   - label: human-readable name
 *   - detect(): examines a CsvDocument and returns confidence + reasons
 *   - parse(): converts the document into normalized evidence
 *
 * The classifier runs all registered parsers' detect() methods and picks
 * the highest confidence match.
 */

import type { CsvDocument } from "./reader";
import type { OptionSummaryRow } from "./fidelity/optionSummaryParser";

// --- Document Metadata ---

/**
 * Common envelope for document-level metadata.
 * Extracted from preamble/headers — not repeated per row.
 */
export interface DocumentMetadata {
  /** Data provider (e.g., "fidelity") */
  source: string;
  /** Document type identifier */
  documentType: string;
  /** Account number if present in the document */
  accountNumber?: string;
  /** Account name if present */
  accountName?: string;
  /** Quote/data date from the document */
  quoteDate?: string;
  /** When the document was downloaded/exported */
  downloadTimestamp?: string;
  /** Original filename */
  filename?: string;
}

// --- Detection ---

export interface DetectionResult {
  /** Confidence 0-1 (1 = certain match) */
  confidence: number;
  /** Human-readable reasons for the confidence score */
  reasons: string[];
  /** Headers that matched expectations */
  matchedHeaders: string[];
  /** Headers that were expected but missing */
  missingHeaders: string[];
}

// --- Typed parsed output ---

/**
 * Discriminated union for parser output.
 * Each parser returns a specific payload type identified by `type`.
 */
export type ParsedPayload =
  | { type: "option_summary"; rows: OptionSummaryRow[] }
  | { type: "holdings"; rows: unknown[] }     // placeholder until HoldingRow is defined
  | { type: "activity"; rows: unknown[] }     // placeholder
  | { type: "orders"; rows: unknown[] }       // placeholder
  | { type: "balances"; rows: unknown[] }     // placeholder
  | { type: "unknown"; rows: unknown[] };

export interface ParsedDocument {
  /** Parser ID that produced this result */
  parserId: string;
  /** Document-level metadata */
  metadata: DocumentMetadata;
  /** Typed payload — discriminated by `type` field */
  payload: ParsedPayload;
  /** Rows that were identified as footer/trailer */
  trailerRows: string[][];
  /** Parser warnings and diagnostics */
  diagnostics: ParserDiagnostic[];
}

export interface ParserDiagnostic {
  level: "info" | "warning" | "error";
  row?: number;
  message: string;
}

// --- Parser interface ---

export interface CsvParser {
  id: string;
  label: string;
  detect(document: CsvDocument): DetectionResult;
  parse(document: CsvDocument, context?: ParseContext): ParsedDocument;
}

/** Optional context passed to parsers (preamble info, filename, etc.) */
export interface ParseContext {
  filename?: string;
  preambleLines?: string[];
}

// --- Registry ---

const parsers: CsvParser[] = [];

export function registerParser(parser: CsvParser): void {
  parsers.push(parser);
}

export function getRegisteredParsers(): CsvParser[] {
  return [...parsers];
}

// --- Classification ---

export interface ClassificationResult {
  /** Best matching parser (null if no parser matched) */
  parser: CsvParser | null;
  /** Detection result from the best parser */
  detection: DetectionResult | null;
  /** All detection results for diagnostics */
  allDetections: { parserId: string; label: string; detection: DetectionResult }[];
}

/**
 * Classify a CsvDocument by running all registered parsers' detect() methods.
 * Returns the highest-confidence match.
 */
export function classifyDocument(document: CsvDocument): ClassificationResult {
  const allDetections = parsers.map((p) => ({
    parserId: p.id,
    label: p.label,
    detection: p.detect(document),
  }));

  // Sort by confidence descending
  allDetections.sort((a, b) => b.detection.confidence - a.detection.confidence);

  const best = allDetections[0];
  if (!best || best.detection.confidence === 0) {
    return { parser: null, detection: null, allDetections };
  }

  const bestParser = parsers.find((p) => p.id === best.parserId) ?? null;
  return { parser: bestParser, detection: best.detection, allDetections };
}
