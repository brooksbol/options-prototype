package com.wheelwright.evidence.production;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FidelityActivityParserTest {

    private final FidelityActivityParser parser = new FidelityActivityParser();

    // --- Fixture loading ---

    private List<FidelityActivityRow> parseFixture() throws Exception {
        InputStream is = getClass().getResourceAsStream("/fixtures/fidelity-activity-july-2026.csv");
        assertNotNull(is, "Fixture file must exist");
        return parser.parse(is);
    }

    // --- Structural parsing tests ---

    @Test
    @DisplayName("parses fixture file without error")
    void parsesFixture() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        assertFalse(rows.isEmpty(), "Should parse at least one row");
    }

    @Test
    @DisplayName("returns rows in chronological order (oldest first)")
    void chronologicalOrder() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        for (int i = 1; i < rows.size(); i++) {
            assertTrue(
                !rows.get(i).runDate().isBefore(rows.get(i - 1).runDate()),
                "Row " + i + " should not be before row " + (i - 1)
            );
        }
    }

    @Test
    @DisplayName("skips disclaimer/footer rows")
    void skipsDisclaimer() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        for (FidelityActivityRow row : rows) {
            assertFalse(row.action().contains("Brokerage services"),
                "Footer text should not appear as a parsed row");
            assertFalse(row.action().contains("data and information"),
                "Disclaimer text should not appear as a parsed row");
        }
    }

    @Test
    @DisplayName("handles BOM in UTF-8 encoded file")
    void handlesBom() throws Exception {
        String csv = "\uFEFF\nRun Date,Action,Symbol,Description,Type,Price ($),Quantity,Commission ($),Fees ($),Accrued Interest ($),Amount ($),Cash Balance ($),Settlement Date\n"
            + "07/15/2026,YOU SOLD OPENING TRANSACTION PUT (XLE) (Cash),-XLE260724P55,PUT XLE,Cash,0.31,\"-1\",0.65,0.01,\"\",30.34,61278.3,07/16/2026\n";
        List<FidelityActivityRow> rows = parser.parse(new ByteArrayInputStream(csv.getBytes(StandardCharsets.UTF_8)));
        assertEquals(1, rows.size());
    }

    @Test
    @DisplayName("parses nullable Price field as null")
    void nullablePrice() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        // DIVIDEND RECEIVED rows have empty price
        FidelityActivityRow dividend = rows.stream()
            .filter(r -> r.action().startsWith("DIVIDEND RECEIVED") && r.symbol().trim().equals("SPAXX"))
            .findFirst().orElseThrow();
        assertNull(dividend.price());
    }

    @Test
    @DisplayName("parses nullable Settlement Date as null")
    void nullableSettlementDate() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        // REINVESTMENT rows have empty settlement date
        FidelityActivityRow reinvestment = rows.stream()
            .filter(r -> r.action().startsWith("REINVESTMENT"))
            .findFirst().orElseThrow();
        assertNull(reinvestment.settlementDate());
    }

    @Test
    @DisplayName("trims leading space from option symbols")
    void trimsOptionSymbol() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        // Option sell-to-open rows have " -XLE..." with leading space in CSV
        FidelityActivityRow optionRow = rows.stream()
            .filter(r -> r.action().startsWith("YOU SOLD OPENING TRANSACTION PUT") && r.symbol().contains("XLE"))
            .findFirst().orElseThrow();
        assertFalse(optionRow.symbol().startsWith(" "), "Symbol should be trimmed");
        assertTrue(optionRow.symbol().startsWith("-XLE"), "Should start with -XLE after trim");
    }

    @Test
    @DisplayName("parses Amount correctly for option sell-to-open")
    void parsesOptionAmount() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        // PSI put: $11.50 × 1 contract, commission $0.65, fees $0.04, net $1149.31
        FidelityActivityRow psi = rows.stream()
            .filter(r -> r.action().contains("PSI") && r.action().contains("OPENING TRANSACTION PUT"))
            .findFirst().orElseThrow();
        assertEquals(new BigDecimal("1149.31"), psi.amount());
        assertEquals(new BigDecimal("0.65"), psi.commission());
        assertEquals(new BigDecimal("0.04"), psi.fees());
    }

    @Test
    @DisplayName("parses negative Amount for withdrawals")
    void parsesNegativeAmount() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow eft = rows.stream()
            .filter(r -> r.action().startsWith("Electronic Funds Transfer Paid"))
            .findFirst().orElseThrow();
        assertTrue(eft.amount().compareTo(BigDecimal.ZERO) < 0, "Withdrawal should be negative");
        assertEquals(new BigDecimal("-2000"), eft.amount());
    }

    @Test
    @DisplayName("parses zero Amount for lifecycle events")
    void parsesZeroAmount() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow expired = rows.stream()
            .filter(r -> r.action().startsWith("EXPIRED"))
            .findFirst().orElseThrow();
        assertEquals(new BigDecimal("0.00"), expired.amount());
    }

    @Test
    @DisplayName("parses Settlement Date when present")
    void parsesSettlementDate() throws Exception {
        List<FidelityActivityRow> rows = parseFixture();
        FidelityActivityRow withSettlement = rows.stream()
            .filter(r -> r.settlementDate() != null)
            .findFirst().orElseThrow();
        assertNotNull(withSettlement.settlementDate());
    }

    @Test
    @DisplayName("rejects CSV without header row")
    void rejectsNoHeader() {
        String noHeader = "07/15/2026,YOU SOLD,XLE,desc,Cash,55,-1,0.65,0.01,,30.34,100,07/16/2026\n";
        assertThrows(FidelityActivityParser.FidelityParseException.class, () ->
            parser.parse(new ByteArrayInputStream(noHeader.getBytes(StandardCharsets.UTF_8)))
        );
    }

    // --- CSV splitting tests ---

    @Test
    @DisplayName("splitCsvLine handles quoted fields with commas")
    void splitQuotedCommas() {
        String line = "a,\"b,c\",d";
        List<String> fields = parser.splitCsvLine(line);
        assertEquals(3, fields.size());
        assertEquals("a", fields.get(0));
        assertEquals("b,c", fields.get(1));
        assertEquals("d", fields.get(2));
    }

    @Test
    @DisplayName("splitCsvLine handles escaped quotes")
    void splitEscapedQuotes() {
        String line = "a,\"say \"\"hello\"\"\",b";
        List<String> fields = parser.splitCsvLine(line);
        assertEquals(3, fields.size());
        assertEquals("say \"hello\"", fields.get(1));
    }

    @Test
    @DisplayName("splitCsvLine handles empty fields")
    void splitEmptyFields() {
        String line = "a,,c,\"\",e";
        List<String> fields = parser.splitCsvLine(line);
        assertEquals(5, fields.size());
        assertEquals("", fields.get(1));
        assertEquals("", fields.get(3));
    }
}
