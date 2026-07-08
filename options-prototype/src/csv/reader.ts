/**
 * Generic CSV Reader.
 *
 * Parses CSV text into a structured document (headers + rows).
 * Knows nothing about Fidelity or any specific export format.
 *
 * Handles:
 *   - Quoted fields (commas inside quotes)
 *   - Escaped quotes (doubled "" inside quoted fields)
 *   - Empty fields
 *   - Trailing commas
 *   - Blank rows (skipped)
 *   - UTF-8
 *   - Windows (\r\n) and Unix (\n) line endings
 *   - BOM (stripped if present)
 */

export interface CsvDocument {
  /** Column headers (first non-blank row) */
  headers: string[];
  /** Data rows (each an array of field values) */
  rows: string[][];
  /** Total line count in the raw input */
  totalLines: number;
  /** Detected delimiter */
  delimiter: string;
}

/**
 * Parse a CSV string into a CsvDocument.
 * Assumes first non-blank row is the header.
 */
export function parseCsv(content: string, delimiter: string = ","): CsvDocument {
  // Strip BOM
  const text = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;

  const lines = splitLines(text);
  const totalLines = lines.length;

  // Parse all non-blank lines into field arrays
  const parsed: string[][] = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    parsed.push(parseRow(line, delimiter));
  }

  if (parsed.length === 0) {
    return { headers: [], rows: [], totalLines, delimiter };
  }

  const headers = parsed[0];
  const rows = parsed.slice(1);

  return { headers, rows, totalLines, delimiter };
}

/**
 * Split text into lines handling both \r\n and \n.
 * Respects quoted fields that span multiple lines.
 */
function splitLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (!inQuotes && (char === "\n" || char === "\r")) {
      // Handle \r\n
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }
      lines.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Don't forget the last line
  if (current.length > 0) {
    lines.push(current);
  }

  return lines;
}

/**
 * Parse a single CSV row into an array of field values.
 * Handles quoted fields and escaped quotes.
 */
function parseRow(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let i = 0;

  while (i <= line.length) {
    if (i === line.length) {
      // Trailing delimiter produced an empty last field
      fields.push("");
      break;
    }

    if (line[i] === '"') {
      // Quoted field
      const { value, nextIndex } = parseQuotedField(line, i, delimiter);
      fields.push(value);
      i = nextIndex;
    } else {
      // Unquoted field
      const delimIdx = line.indexOf(delimiter, i);
      if (delimIdx === -1) {
        fields.push(line.slice(i).trim());
        break;
      } else {
        fields.push(line.slice(i, delimIdx).trim());
        i = delimIdx + delimiter.length;
      }
    }
  }

  return fields;
}

/**
 * Parse a quoted field starting at position `start`.
 * Returns the unescaped value and the index after the closing quote + delimiter.
 */
function parseQuotedField(
  line: string,
  start: number,
  delimiter: string
): { value: string; nextIndex: number } {
  let value = "";
  let i = start + 1; // skip opening quote

  while (i < line.length) {
    if (line[i] === '"') {
      if (line[i + 1] === '"') {
        // Escaped quote
        value += '"';
        i += 2;
      } else {
        // End of quoted field
        i++; // skip closing quote
        // Skip delimiter if present
        if (line.slice(i, i + delimiter.length) === delimiter) {
          i += delimiter.length;
        }
        return { value, nextIndex: i };
      }
    } else {
      value += line[i];
      i++;
    }
  }

  // Unterminated quote — return what we have
  return { value, nextIndex: i };
}

/**
 * Auto-detect the delimiter from the first line of a CSV.
 * Checks comma, tab, semicolon, pipe.
 */
export function detectDelimiter(content: string): string {
  const firstLine = content.split(/\r?\n/)[0] ?? "";
  const candidates = [",", "\t", ";", "|"];
  let best = ",";
  let bestCount = 0;

  for (const delim of candidates) {
    const count = firstLine.split(delim).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = delim;
    }
  }

  return best;
}
