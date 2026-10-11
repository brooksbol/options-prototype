package com.wheelwright.evidence.v2;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.sql.Connection;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

/** Optional broker quote facts only. Strategy rows never count inventory or create Positions. */
final class PositionMarketEvidence {
    record Facts(BigDecimal bid, BigDecimal ask, BigDecimal requirement, BigDecimal reportedQuantity,
            PositionSnapshot.MarketEvidence provenance) {}
    static Map<String, Facts> read(Connection c, PositionSnapshot snapshot, ObjectMapper mapper) throws Exception {
        var result = new HashMap<String, Facts>();
        // Latest retained, accepted Option Summary on the SAME export day only. Read in the
        // caller's SQLite read transaction; never combine a different-day summary silently.
        try (var q = c.prepareStatement("""
                SELECT a.artifact_id, a.sha256, a.payload, i.original_filename FROM brokerage_artifact a
                JOIN brokerage_import i ON i.account=a.account AND i.artifact_id=a.artifact_id
                WHERE a.account=? AND i.file_type='OPTION_SUMMARY' AND i.status='ACCEPTED'
                ORDER BY a.received_at DESC, a.artifact_id DESC
                """)) {
            q.setString(1, snapshot.account());
            try (var rs = q.executeQuery()) { while (rs.next()) {
                String text = new String(rs.getBytes("payload"), java.nio.charset.StandardCharsets.UTF_8);
                var date = Pattern.compile("Quote data as of (\\d{2}/\\d{2}/\\d{4})\\.").matcher(text);
                if (!date.find() || !LocalDate.parse(date.group(1), DateTimeFormatter.ofPattern("MM/dd/uuuu")).toString().equals(snapshot.evidenceDate())) continue;
                try (var rows = c.prepareStatement("SELECT source_row, row_json FROM brokerage_evidence_row WHERE account=? AND artifact_id=? AND file_type='OPTION_SUMMARY' ORDER BY source_row")) {
                    rows.setString(1, snapshot.account()); rows.setString(2, rs.getString("artifact_id"));
                    try (var row = rows.executeQuery()) { while (row.next()) {
                        var json = mapper.readTree(row.getString("row_json"));
                        String terms = json.path("Expiration & Strike").asText(), symbol = json.path("Symbol").asText();
                        String contract = contract(symbol, terms);
                        if (contract == null) continue;
                        var facts = new Facts(FidelityPositions.number(json.path("Bid").asText()), FidelityPositions.number(json.path("Ask").asText()),
                                terms.startsWith("Shares") ? null : FidelityPositions.number(json.path("Margin requirements").asText()),
                                FidelityPositions.number(json.path("Quantity").asText()), new PositionSnapshot.MarketEvidence(rs.getString("artifact_id"),
                                rs.getString("original_filename"), rs.getString("sha256"), snapshot.evidenceDate(), List.of(row.getInt("source_row"))));
                        var prior = result.get(contract);
                        if (prior == null) result.put(contract, facts);
                        else {
                            boolean same = Objects.equals(prior.bid(), facts.bid()) && Objects.equals(prior.ask(), facts.ask());
                            var sourceRows = new ArrayList<>(prior.provenance().sourceRows()); sourceRows.addAll(facts.provenance().sourceRows());
                            var provenance = new PositionSnapshot.MarketEvidence(facts.provenance().artifactId(), facts.provenance().sourceFile(),
                                    facts.provenance().sourceSha256(), facts.provenance().evidenceDate(), List.copyOf(sourceRows));
                            result.put(contract, new Facts(same ? prior.bid() : null, same ? prior.ask() : null, null, null, provenance));
                        }
                    } }
                }
                break;
            } }
        }
        return result;
    }
    private static String contract(String symbol, String terms) {
        if (terms.equals("Shares")) return symbol;
        var shares = Pattern.compile("Shares \\(([A-Z0-9.]+)\\)").matcher(terms);
        if (shares.matches()) return shares.group(1);
        var option = Pattern.compile("([A-Z0-9.]+) ([A-Z]{3}) (\\d{2}) (\\d{4}) \\$(\\d+(?:\\.\\d+)?) (CALL|PUT)(?: \\(ADJ\\))?").matcher(terms);
        if (!option.matches()) return null;
        LocalDate date = LocalDate.parse(option.group(2) + " " + option.group(3) + " " + option.group(4),
                new java.time.format.DateTimeFormatterBuilder().parseCaseInsensitive().appendPattern("MMM dd uuuu").toFormatter(Locale.US));
        return "-" + option.group(1) + date.format(DateTimeFormatter.ofPattern("uuMMdd")) + option.group(6).charAt(0) + new BigDecimal(option.group(5)).stripTrailingZeros().toPlainString();
    }
}
