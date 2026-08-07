package com.wheelwright.evidence.production;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Parses Fidelity Activity History CSV exports into FidelityActivityRow records.
 *
 * Handles:
 * - UTF-8 BOM
 * - Header row detection
 * - Nullable/empty numeric fields
 * - Quoted fields with commas (RFC 4180 basic quoting)
 * - Trailing disclaimer rows (non-data)
 * - Reverse-chronological file order → returns chronological
 *
 * Does NOT classify or interpret transactions — pure structural parsing.
 */
public class FidelityActivityParser {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("MM/dd/yyyy");

    /**
     * Parse a Fidelity Activity History CSV from an InputStream.
     *
     * @return List of rows in chronological order (oldest first)
     * @throws FidelityParseException if the CSV structure is unrecognizable
     */
    public List<FidelityActivityRow> parse(InputStream input) throws FidelityParseException {
        List<FidelityActivityRow> rows = new ArrayList<>();
        boolean headerFound = false;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(input, StandardCharsets.UTF_8))) {
            String line;

            while ((line = reader.readLine()) != null) {
                // Skip BOM if present
                if (!headerFound && line.startsWith("\uFEFF")) {
                    line = line.substring(1);
                }

                // Skip empty lines
                String trimmed = line.trim();
                if (trimmed.isEmpty()) continue;

                // Detect and skip header
                if (!headerFound) {
                    if (trimmed.startsWith("Run Date,")) {
                        headerFound = true;
                        continue;
                    }
                    // Skip any pre-header content (e.g., BOM-only line)
                    continue;
                }

                // Stop at disclaimer/footer (lines starting with quote that aren't data)
                if (trimmed.startsWith("\"") && !looksLikeDataRow(trimmed)) {
                    break;
                }

                // Stop at "Date downloaded" footer
                if (trimmed.startsWith("Date downloaded")) {
                    break;
                }

                // Parse data row
                FidelityActivityRow row = parseRow(line);
                if (row != null) {
                    rows.add(row);
                }
            }
        } catch (IOException e) {
            throw new FidelityParseException("Failed to read CSV input", e);
        }

        if (!headerFound) {
            throw new FidelityParseException("No header row found — not a recognized Fidelity Activity History CSV");
        }

        // Fidelity exports newest-first; reverse to chronological order
        Collections.reverse(rows);
        return rows;
    }

    private FidelityActivityRow parseRow(String line) throws FidelityParseException {
        List<String> fields = splitCsvLine(line);
        if (fields.size() < 13) {
            // Tolerate short rows silently (may be malformed footer fragments)
            return null;
        }

        try {
            LocalDate runDate = parseDate(fields.get(0));
            String action = fields.get(1).trim();
            String symbol = fields.get(2).trim(); // removes leading space from option symbols
            String description = fields.get(3).trim();
            String type = fields.get(4).trim();
            BigDecimal price = parseDecimal(fields.get(5));
            BigDecimal quantity = parseDecimal(fields.get(6));
            BigDecimal commission = parseDecimal(fields.get(7));
            BigDecimal fees = parseDecimal(fields.get(8));
            BigDecimal accruedInterest = parseDecimal(fields.get(9));
            BigDecimal amount = parseDecimal(fields.get(10));
            BigDecimal cashBalance = parseDecimal(fields.get(11));
            LocalDate settlementDate = parseDateNullable(fields.get(12));

            if (runDate == null || action.isEmpty()) {
                return null; // not a valid data row
            }

            return new FidelityActivityRow(
                runDate, action, symbol, description, type,
                price, quantity, commission, fees, accruedInterest,
                amount, cashBalance, settlementDate
            );
        } catch (Exception e) {
            throw new FidelityParseException("Failed to parse row: " + line, e);
        }
    }

    /**
     * Split a CSV line respecting quoted fields.
     * Handles: fields containing commas inside double quotes.
     */
    List<String> splitCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    // Escaped quote
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                fields.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        fields.add(current.toString());
        return fields;
    }

    private LocalDate parseDate(String value) {
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        return LocalDate.parse(trimmed, DATE_FORMAT);
    }

    private LocalDate parseDateNullable(String value) {
        String trimmed = value.trim();
        if (trimmed.isEmpty()) return null;
        try {
            return LocalDate.parse(trimmed, DATE_FORMAT);
        } catch (Exception e) {
            return null;
        }
    }

    private BigDecimal parseDecimal(String value) {
        String trimmed = value.trim().replace("\"", "");
        if (trimmed.isEmpty()) return null;
        // Handle negative amounts like "-142.11" and "$" if present
        trimmed = trimmed.replace("$", "").replace(",", "");
        try {
            return new BigDecimal(trimmed);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Heuristic: a data row typically starts with a date (MM/DD/YYYY format).
     * Disclaimer rows start with quoted prose.
     */
    private boolean looksLikeDataRow(String line) {
        // Data rows that start with a quote are typically those with quoted fields
        // after the first comma. But the first field (Run Date) is never quoted.
        // If the line starts with a quote, it's likely a disclaimer paragraph.
        // Exception: some lines might have leading whitespace before the date.
        String unquoted = line.replaceFirst("^\"", "");
        return unquoted.length() > 0 && Character.isDigit(unquoted.charAt(0));
    }

    public static class FidelityParseException extends Exception {
        public FidelityParseException(String message) {
            super(message);
        }

        public FidelityParseException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
