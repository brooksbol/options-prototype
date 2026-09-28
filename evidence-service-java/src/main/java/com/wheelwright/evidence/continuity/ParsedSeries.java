package com.wheelwright.evidence.continuity;

import com.wheelwright.evidence.production.FidelityActivityRow;

import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Minimal option-series parse for continuity matching (underlying, type, expiration, strike).
 *
 * Bounded to what the continuity engine needs to decide whether a raw History row belongs to
 * the assessed series. It does not build a general option model. Returns null when the row is
 * not recognizably an option row for a specific series — the engine then treats it as
 * not-target-series (irrelevant to this option obligation).
 */
final class ParsedSeries {
    final String underlying;
    final String optionType; // "CALL" | "PUT"
    final LocalDate expiration;
    final double strike;

    private ParsedSeries(String underlying, String optionType, LocalDate expiration, double strike) {
        this.underlying = underlying;
        this.optionType = optionType;
        this.expiration = expiration;
        this.strike = strike;
    }

    private static final java.util.Map<String, String> MONTHS = java.util.Map.ofEntries(
        java.util.Map.entry("JAN", "01"), java.util.Map.entry("FEB", "02"), java.util.Map.entry("MAR", "03"),
        java.util.Map.entry("APR", "04"), java.util.Map.entry("MAY", "05"), java.util.Map.entry("JUN", "06"),
        java.util.Map.entry("JUL", "07"), java.util.Map.entry("AUG", "08"), java.util.Map.entry("SEP", "09"),
        java.util.Map.entry("OCT", "10"), java.util.Map.entry("NOV", "11"), java.util.Map.entry("DEC", "12"));

    // Description form: "CALL (XLE) SELECT SECTOR SPDR JUL 10 26 $57.5 (100 SHS)"
    private static final Pattern DESC =
        Pattern.compile("(PUT|CALL)\\s+\\((\\w+)\\).+?([A-Z]{3})\\s+(\\d{1,2})\\s+(\\d{2})\\s+\\$?([\\d.]+)",
            Pattern.CASE_INSENSITIVE);

    /** Parse the option series from a raw History row's description/action, or null. */
    static ParsedSeries fromRow(FidelityActivityRow row) {
        String desc = row.description();
        ParsedSeries fromDesc = parse(desc);
        if (fromDesc != null) return fromDesc;
        return parse(row.action());
    }

    // Explicit economic "as of" date, e.g. "ASSIGNED as of 09/20/2026" or "... as of 2026-09-20".
    private static final Pattern AS_OF =
        Pattern.compile("as of\\s+(\\d{1,2})[/-](\\d{1,2})[/-](\\d{4})", Pattern.CASE_INSENSITIVE);
    private static final Pattern AS_OF_ISO =
        Pattern.compile("as of\\s+(\\d{4})-(\\d{2})-(\\d{2})", Pattern.CASE_INSENSITIVE);

    /**
     * Extract the explicit economic "as of" date from a row's action/description, or null when
     * none is present. Doc 70 §4: the explicit economic "as of" date controls when present;
     * Run Date is only the bounded fallback. Never inferred.
     */
    static LocalDate asOfDate(FidelityActivityRow row) {
        LocalDate d = asOf(row.action());
        if (d != null) return d;
        return asOf(row.description());
    }

    private static LocalDate asOf(String text) {
        if (text == null || text.isBlank()) return null;
        Matcher iso = AS_OF_ISO.matcher(text);
        if (iso.find()) {
            try { return LocalDate.parse(iso.group(1) + "-" + iso.group(2) + "-" + iso.group(3)); }
            catch (Exception e) { return null; }
        }
        Matcher m = AS_OF.matcher(text);
        if (m.find()) {
            String mm = String.format("%02d", Integer.parseInt(m.group(1)));
            String dd = String.format("%02d", Integer.parseInt(m.group(2)));
            try { return LocalDate.parse(m.group(3) + "-" + mm + "-" + dd); }
            catch (Exception e) { return null; }
        }
        return null;
    }

    private static ParsedSeries parse(String text) {
        if (text == null || text.isBlank()) return null;
        Matcher m = DESC.matcher(text);
        if (!m.find()) return null;
        String type = m.group(1).toUpperCase();
        String underlying = m.group(2).toUpperCase();
        String mon = MONTHS.getOrDefault(m.group(3).toUpperCase(), null);
        if (mon == null) return null;
        String day = String.format("%02d", Integer.parseInt(m.group(4)));
        String year = "20" + m.group(5);
        double strike;
        try {
            strike = Double.parseDouble(m.group(6));
        } catch (NumberFormatException e) {
            return null;
        }
        LocalDate exp;
        try {
            exp = LocalDate.parse(year + "-" + mon + "-" + day);
        } catch (Exception e) {
            return null;
        }
        return new ParsedSeries(underlying, type, exp, strike);
    }
}
