package com.wheelwright.evidence;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Session Gate Tests — fixed instants mirroring TypeScript session-gate.test.ts.
 *
 * Uses the same DST approximation as the TypeScript implementation:
 *   EDT (UTC-4) for summer months, EST (UTC-5) otherwise.
 */
class SessionGateTest {

    private final SessionGate gate = new SessionGate(Clock.systemUTC());

    /**
     * Create an Instant at a specific ET time on a given date.
     * Matches the TypeScript test helper: adds UTC offset to ET hours.
     */
    private static Instant etInstant(String dateStr, int etHours, int etMinutes) {
        LocalDate date = LocalDate.parse(dateStr);
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();
        // Same DST logic as TypeScript gate
        boolean isEDT = (month > 3 && month < 11) || (month == 3 && day >= 8) || (month == 11 && day < 1);
        int utcOffset = isEDT ? 4 : 5; // hours to add to ET to get UTC
        int utcHours = etHours + utcOffset;
        // Handle day rollover (e.g., 20:00 ET + 4 = 24:00 UTC = next day 00:00)
        LocalDate utcDate = date;
        if (utcHours >= 24) {
            utcHours -= 24;
            utcDate = date.plusDays(1);
        }
        return ZonedDateTime.of(utcDate, LocalTime.of(utcHours, etMinutes),
            ZoneOffset.UTC).toInstant();
    }

    @Nested
    @DisplayName("regular session")
    class RegularSession {

        @Test
        @DisplayName("permits acquisition at 10:00 ET on a trading day")
        void permitsAt1000ET() {
            var result = gate.isPermitted(etInstant("2026-07-15", 10, 0)); // Wednesday
            assertTrue(result.permitted());
            assertEquals("Regular session", result.reason());
        }

        @Test
        @DisplayName("permits acquisition at 15:00 ET on a trading day")
        void permitsAt1500ET() {
            var result = gate.isPermitted(etInstant("2026-07-15", 15, 0));
            assertTrue(result.permitted());
        }

        @Test
        @DisplayName("permits acquisition at 16:14 ET (within delay drain)")
        void permitsAt1614ET() {
            var result = gate.isPermitted(etInstant("2026-07-15", 16, 14));
            assertTrue(result.permitted());
        }
    }

    @Nested
    @DisplayName("weekends")
    class Weekends {

        @Test
        @DisplayName("blocks acquisition on Saturday")
        void blocksSaturday() {
            var result = gate.isPermitted(etInstant("2026-07-18", 12, 0)); // Saturday
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Weekend"));
        }

        @Test
        @DisplayName("blocks acquisition on Sunday")
        void blocksSunday() {
            var result = gate.isPermitted(etInstant("2026-07-19", 12, 0)); // Sunday
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Weekend"));
        }
    }

    @Nested
    @DisplayName("holidays")
    class Holidays {

        @Test
        @DisplayName("blocks acquisition on July 4 observed (July 3, 2026)")
        void blocksJuly4Observed() {
            var result = gate.isPermitted(etInstant("2026-07-03", 12, 0)); // Thursday
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Exchange holiday"));
        }

        @Test
        @DisplayName("blocks acquisition on Thanksgiving")
        void blocksThanksgiving() {
            var result = gate.isPermitted(etInstant("2026-11-26", 12, 0)); // Thursday
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Exchange holiday"));
        }
    }

    @Nested
    @DisplayName("early-close days")
    class EarlyClose {

        @Test
        @DisplayName("permits acquisition at 12:00 ET on day after Thanksgiving")
        void permitsAt1200OnBlackFriday() {
            var result = gate.isPermitted(etInstant("2026-11-27", 12, 0)); // Friday
            assertTrue(result.permitted());
            assertEquals("Regular session", result.reason());
        }

        @Test
        @DisplayName("permits acquisition at 13:29 ET on day after Thanksgiving (within early window)")
        void permitsAt1329OnBlackFriday() {
            var result = gate.isPermitted(etInstant("2026-11-27", 13, 29));
            assertTrue(result.permitted());
        }

        @Test
        @DisplayName("blocks acquisition at 13:31 ET on day after Thanksgiving (past early close + delay)")
        void blocksAt1331OnBlackFriday() {
            var result = gate.isPermitted(etInstant("2026-11-27", 13, 31));
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Early close"));
        }

        @Test
        @DisplayName("blocks acquisition at 14:00 ET on day after Thanksgiving")
        void blocksAt1400OnBlackFriday() {
            var result = gate.isPermitted(etInstant("2026-11-27", 14, 0));
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Early close"));
        }

        @Test
        @DisplayName("permits acquisition at 10:00 ET on Christmas Eve")
        void permitsAt1000OnChristmasEve() {
            var result = gate.isPermitted(etInstant("2026-12-24", 10, 0)); // Thursday
            assertTrue(result.permitted());
        }

        @Test
        @DisplayName("blocks acquisition at 14:00 ET on Christmas Eve")
        void blocksAt1400OnChristmasEve() {
            var result = gate.isPermitted(etInstant("2026-12-24", 14, 0));
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Early close"));
        }
    }

    @Nested
    @DisplayName("off-hours")
    class OffHours {

        @Test
        @DisplayName("blocks acquisition at 09:00 ET (pre-market)")
        void blocksPreMarket() {
            var result = gate.isPermitted(etInstant("2026-07-15", 9, 0));
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Pre-market"));
        }

        @Test
        @DisplayName("blocks acquisition at 16:30 ET (post-market)")
        void blocksPostMarket() {
            var result = gate.isPermitted(etInstant("2026-07-15", 16, 30));
            assertFalse(result.permitted());
            assertTrue(result.reason().contains("Market closed"));
        }

        @Test
        @DisplayName("blocks acquisition at 20:00 ET (evening)")
        void blocksEvening() {
            var result = gate.isPermitted(etInstant("2026-07-15", 20, 0));
            assertFalse(result.permitted());
        }
    }
}
