/**
 * Stub parsers for Fidelity export types not yet fully implemented.
 *
 * These detect their document type but return "not implemented" when parsed.
 * They exist so the classifier can correctly identify documents even if
 * full parsing isn't available yet.
 */

import type { CsvDocument } from "../reader";
import type { CsvParser, DetectionResult, ParsedDocument, ParseContext } from "../registry";

function createStubParser(
  id: string,
  label: string,
  headerSignals: string[],
  titleSignal?: string
): CsvParser {
  return {
    id,
    label,
    detect(document: CsvDocument): DetectionResult {
      const headersLower = document.headers.map((h) => h.toLowerCase().trim());
      const matchedHeaders: string[] = [];
      const missingHeaders: string[] = [];
      const reasons: string[] = [];
      let confidence = 0;

      for (const signal of headerSignals) {
        if (headersLower.some((h) => h.includes(signal))) {
          matchedHeaders.push(signal);
          confidence += 0.15;
        } else {
          missingHeaders.push(signal);
        }
      }

      if (titleSignal) {
        const allText = [document.headers.join(" "), ...document.rows.map((r) => r.join(" "))].join(" ").toLowerCase();
        if (allText.includes(titleSignal.toLowerCase())) {
          reasons.push(`Contains "${titleSignal}" identifier`);
          confidence += 0.2;
        }
      }

      confidence = Math.min(confidence, 0.9); // Never 1.0 for stubs

      if (matchedHeaders.length > 0) {
        reasons.push(`Matched ${matchedHeaders.length} header signals`);
      }

      return { confidence, reasons, matchedHeaders, missingHeaders };
    },

    parse(_document: CsvDocument, context?: ParseContext): ParsedDocument {
      return {
        parserId: id,
        metadata: {
          source: "fidelity",
          documentType: id,
          filename: context?.filename,
        },
        payload: { type: "unknown", rows: [] },
        trailerRows: [],
        diagnostics: [
          { level: "warning", message: `Parser "${label}" is not yet implemented. Detection succeeded but parsing is unavailable.` },
        ],
      };
    },
  };
}

export const fidelityBalancesParser = createStubParser(
  "fidelity_balances",
  "Fidelity Balances",
  ["account name", "account number", "account type", "available"],
  "Balances"
);

export const fidelityOrdersParser = createStubParser(
  "fidelity_orders",
  "Fidelity Orders",
  ["symbol", "action", "quantity", "order type", "status", "limit price"],
  "Orders"
);
