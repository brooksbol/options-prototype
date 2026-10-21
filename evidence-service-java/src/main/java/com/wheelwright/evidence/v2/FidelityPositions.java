package com.wheelwright.evidence.v2;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

/** Narrow Positions export admission. Option Summary is never used to count inventory. */
public final class FidelityPositions {
    private FidelityPositions() {}
    public static String digest(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public static PositionSnapshot parse(String alias, String brokerAccount, String filename,
            String csv, String recordedAt, List<PositionSnapshot.Association> associations) {
        return parse(alias,brokerAccount,filename,csv,recordedAt,associations,alias);
    }
    public static PositionSnapshot parse(String alias, String brokerAccount, String filename,
            String csv, String recordedAt, List<PositionSnapshot.Association> associations, String identityNamespace) {
        if (!AccountDirectory.validId(alias) || !brokerAccount.matches("[A-Z0-9]+"))
            throw new IllegalArgumentException("invalid account identity");
        var rows = csv(csv.replaceFirst("^\uFEFF", ""));
        if (rows.isEmpty()) throw new IllegalArgumentException("empty CSV");
        var header = rows.getFirst();
        for (String required : List.of("Account number", "Account name", "Investment type", "Symbol",
                "Description", "Quantity", "Current value", "Total gain/loss dollar", "Type"))
            if (!header.contains(required)) throw new IllegalArgumentException("missing column: " + required);
        var datePattern = Pattern.compile("Date downloaded ([A-Za-z]{3}-\\d{2}-\\d{4}) (?:at )?.+");
        String evidenceDate = null;
        for (var row : rows) if (row.size() == 1) {
            var match = datePattern.matcher(row.getFirst());
            if (match.matches()) evidenceDate = LocalDate.parse(match.group(1),
                    DateTimeFormatter.ofPattern("MMM-dd-uuuu", Locale.US)).toString();
        }
        if (evidenceDate == null) throw new IllegalArgumentException("missing export date");
        var holdings = new LinkedHashMap<String, PositionSnapshot.Constituent>();
        int excluded = 0;
        String accountName = null;
        for (int r = 1; r < rows.size(); r++) {
            var row = rows.get(r);
            if (row.isEmpty() || !row.getFirst().trim().equals(brokerAccount)) continue;
            if (row.size() < header.size()) throw new IllegalArgumentException("truncated account row");
            String name = cell(header, row, "Account name");
            if (accountName != null && !accountName.equals(name)) throw new IllegalArgumentException("account name conflict");
            accountName = name;
            String kind = cell(header, row, "Investment type"), contract = cell(header, row, "Symbol");
            String sourceQuantity=cell(header,row,"Quantity");if(sourceQuantity.contains("$"))throw new IllegalArgumentException("quantity must be reported units, not currency");BigDecimal quantity = number(sourceQuantity);
            if (quantity == null || kind.isEmpty() || kind.equals("Cash")) { excluded++; continue; }
            if (contract.isBlank()) throw new IllegalArgumentException("missing holding contract");
            String custody = cell(header, row, "Type");
            String holdingId = "holding-" + digest(identityNamespace + "|" + contract + "|" + custody).substring(0, 24);
            String expiration = null;
            if (kind.equals("Options")) {
                var match = Pattern.compile("-?([A-Z0-9.]+?)(\\d{6})[CP]\\d+(?:\\.\\d+)?").matcher(contract);
                if (match.matches()) expiration = LocalDate.parse(match.group(2),
                        DateTimeFormatter.ofPattern("uuMMdd")).toString();
            }
            var next = new PositionSnapshot.Constituent(holdingId, contract,
                    cell(header, row, "Description"), kind, custody, quantity,
                    number(cell(header, row, "Total gain/loss dollar")),
                    number(cell(header, row, "Current value")), null, null, expiration, List.of(r + 1));
            var prior = holdings.get(holdingId);
            if (prior != null) {
                if (!prior.description().equals(next.description()) || !prior.kind().equals(next.kind()))
                    throw new IllegalArgumentException("conflicting holding evidence");
                var lines = new ArrayList<>(prior.sourceRows()); lines.addAll(next.sourceRows());
                next = new PositionSnapshot.Constituent(holdingId, contract, next.description(), kind,
                        custody, prior.quantity().add(quantity), sum(prior.openPl(), next.openPl()),
                        sum(prior.marketValue(), next.marketValue()), null, null, expiration, List.copyOf(lines));
            }
            holdings.put(holdingId, next);
        }
        if (accountName == null) throw new IllegalArgumentException("source does not contain requested broker account");
        validateAssociations(associations, holdings.keySet());
        String sha = digest(csv);
        String id = digest(alias + "|" + sha + "|" + associations.toString());
        return new PositionSnapshot(alias, brokerAccount, accountName, id, evidenceDate, recordedAt,
                filename, sha, null, List.copyOf(holdings.values()), List.copyOf(associations), excluded);
    }
    static void validateAssociations(List<PositionSnapshot.Association> associations, Set<String> holdings) {
        var used = new HashSet<String>(); var ids = new HashSet<String>();
        for (var a : associations) {
            if (a.positionId() == null || !a.positionId().matches("position-[a-f0-9]{24}") ||
                    !ids.add(a.positionId()) || a.label() == null || a.label().isBlank() ||
                    a.authority() == null || a.authority().isBlank() || a.holdingIds() == null || a.holdingIds().isEmpty())
                throw new IllegalArgumentException("invalid explicit Position association");
            for (String id : a.holdingIds()) if (!holdings.contains(id) || !used.add(id))
                throw new IllegalArgumentException("missing or multiply allocated holding");
        }
    }
    public static BigDecimal sum(BigDecimal a, BigDecimal b) { return a == null || b == null ? null : a.add(b); }
    private static String cell(List<String> headers, List<String> row, String key) {
        return row.get(headers.indexOf(key)).trim();
    }
    public static BigDecimal number(String s) {
        if (s.isBlank() || s.equals("--")) return null;
        // A sign/currency prefix is lexical; removing arbitrary characters must never turn 1+2 into12.
        if(!s.matches("(?:[+-]?\\$?|\\$[+-]?)(?:[0-9]+(?:\\.[0-9]*)?|[0-9]{1,3}(?:,[0-9]{3})+(?:\\.[0-9]+)?|\\.[0-9]+)"))throw new IllegalArgumentException("unsupported source numeric format");
        return new BigDecimal(s.replace("$", "").replace(",", ""));
    }
    /** RFC4180 quoting, embedded newline/comma support; malformed input never partially admits. */
    public static List<List<String>> csv(String text) {
        var result = new ArrayList<List<String>>(); var row = new ArrayList<String>();
        var value = new StringBuilder(); boolean quoted = false, closed = false;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (quoted) {
                if (c == '"') {
                    if (i + 1 < text.length() && text.charAt(i + 1) == '"') { value.append('"'); i++; }
                    else { quoted = false; closed = true; }
                } else value.append(c);
            } else if (c == ',' || c == '\n' || c == '\r') {
                row.add(value.toString()); value.setLength(0); closed = false;
                if (c != ',') {
                    result.add(List.copyOf(row)); row.clear();
                    if (c == '\r' && i + 1 < text.length() && text.charAt(i + 1) == '\n') i++;
                }
            } else if (c == '"' && value.isEmpty() && !closed) quoted = true;
            else {
                if (closed || c == '"') throw new IllegalArgumentException("malformed CSV quoting");
                value.append(c);
            }
        }
        if (quoted) throw new IllegalArgumentException("unterminated CSV quote");
        if (!row.isEmpty() || !value.isEmpty() || closed) { row.add(value.toString()); result.add(List.copyOf(row)); }
        return result;
    }
}
